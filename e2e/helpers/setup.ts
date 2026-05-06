import { mockServer } from './mockServer'

beforeAll(async () => {
  await mockServer.start()
})

afterAll(async () => {
  await mockServer.stop()
})

beforeEach(() => {
  mockServer.reset()
})
