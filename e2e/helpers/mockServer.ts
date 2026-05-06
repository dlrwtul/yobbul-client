/**
 * Lightweight Express mock server that intercepts all HTTP calls from the
 * React Native app during Detox tests.
 *
 * The app reads API URLs from app.json extra → env vars:
 *   apiUrl  = http://localhost:3000   (orders, drivers…)
 *   authUrl = http://localhost:3001   (auth service)
 *
 * In test builds (DETOX_TEST=true), override those to point at this server:
 *   apiUrl  = http://localhost:3333
 *   authUrl = http://localhost:3333
 *
 * Usage:
 *   const server = new MockServer()
 *   await server.start()          // call in beforeAll
 *   server.reset()                // call in beforeEach
 *   server.stub('POST', '/api/v1/auth/request-otp', 200, { message: 'OTP sent' })
 *   await server.stop()           // call in afterAll
 */

import http from 'http'

interface Stub {
  method: string
  path:   string
  status: number
  body:   unknown
  times:  number   // -1 = unlimited
}

export class MockServer {
  private stubs:  Stub[]  = []
  private calls:  { method: string; path: string; body: unknown }[] = []
  private server: http.Server | null = null
  readonly port = 3333

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        let raw = ''
        req.on('data', (chunk) => { raw += chunk })
        req.on('end', () => {
          const body = raw ? (() => { try { return JSON.parse(raw) } catch { return raw } })() : null
          const call = { method: req.method ?? 'GET', path: req.url ?? '/', body }
          this.calls.push(call)

          const stub = this.stubs.find(
            (s) => s.method === call.method && call.path.startsWith(s.path) && s.times !== 0,
          )

          if (stub) {
            if (stub.times > 0) stub.times--
            res.writeHead(stub.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(stub.body))
          } else {
            // Default: 200 empty
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end('{}')
          }
        })
      })

      this.server.listen(this.port, '0.0.0.0', () => resolve())
      this.server.on('error', reject)
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) return resolve()
      this.server.close((err) => (err ? reject(err) : resolve()))
    })
  }

  reset() {
    this.stubs = []
    this.calls = []
  }

  stub(method: string, path: string, status: number, body: unknown, times = -1) {
    this.stubs.unshift({ method: method.toUpperCase(), path, status, body, times })
    return this
  }

  // Returns all recorded calls to a given path
  received(method: string, path: string) {
    return this.calls.filter(
      (c) => c.method === method.toUpperCase() && c.path.startsWith(path),
    )
  }

  calledOnce(method: string, path: string): boolean {
    return this.received(method, path).length === 1
  }
}

// ── Singleton shared across spec files ───────────────────────────────────────

export const mockServer = new MockServer()
