# Yobbul Client

Application mobile client Yobbul (iOS & Android) : commandez une livraison, suivez votre livreur en temps réel et gérez votre historique. Construite avec Expo SDK 54 et React Native 0.81.

---

## Prérequis

| Outil | Version | Notes |
|---|---|---|
| Node.js | >= 22.x | `node --version` |
| npm | >= 10.x | `npm --version` |
| Expo CLI | >= 0.22.x | `npx expo --version` |
| Expo Go | dernière | app sur App Store / Play Store (dev uniquement) |
| Xcode | >= 15.x | macOS — build iOS natif |
| Android Studio | >= 2024.x | build Android natif |
| JDK | >= 17 | requis pour Android |

---

## Installation rapide

```bash
cd yobbul-client

# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env
# Renseigner EXPO_PUBLIC_API_URL et EXPO_PUBLIC_AUTH_URL

# 3. Démarrer le serveur de développement Expo
npx expo start

# Scan du QR code avec Expo Go pour lancer sur un appareil physique
# Ou appuyer sur :
#   a  → Android Emulator
#   i  → Simulateur iOS
#   w  → navigateur web (mode dégradé)
```

---

## Variables d'environnement

| Variable | Description | Exemple | Requis |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL base du service orders/drivers | `http://192.168.1.x:3000` | Oui |
| `EXPO_PUBLIC_AUTH_URL` | URL base du service auth | `http://192.168.1.x:3001` | Oui |
| `EXPO_PUBLIC_TRACKING_WS_URL` | URL WebSocket tracking | `ws://192.168.1.x:3003/tracking` | Oui |

> En l'absence de ces variables, les valeurs de `app.json > extra` sont utilisées comme fallback. Ne jamais pointer vers `localhost` depuis un appareil physique — utiliser l'IP LAN de la machine de développement.

---

## Architecture

```
yobbul-client/
├── src/
│   ├── api/
│   │   ├── client.ts          # Deux instances Axios (authClient / apiClient)
│   │   │                      #   intercepteur JWT auto-refresh (single-flight)
│   │   ├── auth.api.ts        # requestOtp, verifyOtp, me, logout
│   │   ├── orders.api.ts      # list, findOne, estimate, create
│   │   ├── drivers.api.ts     # profil livreur en cours de mission
│   │   └── promos.api.ts      # validation codes promo
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx  # Bascule AuthNavigator ↔ AppNavigator selon auth
│   │   ├── AuthNavigator.tsx  # Stack : Splash → PhoneInput → OTPVerify
│   │   ├── AppNavigator.tsx   # Bottom tabs : Home / Historique / Profil
│   │   └── HomeStack.tsx      # Stack : Home → Pickup → Dropoff → Package → Confirm → Tracking
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.tsx      # Logo animé + check SecureStore
│   │   │   ├── PhoneInputScreen.tsx  # Sélecteur pays + numéro formaté
│   │   │   └── OTPVerifyScreen.tsx   # 6 inputs + countdown 5 min + haptic
│   │   ├── home/
│   │   │   └── HomeScreen.tsx        # Carte + bouton Commander
│   │   ├── order/
│   │   │   ├── PickupScreen.tsx      # Saisie adresse de collecte
│   │   │   ├── DropoffScreen.tsx     # Saisie adresse de livraison
│   │   │   ├── PackageScreen.tsx     # Type colis + type véhicule
│   │   │   ├── ConfirmScreen.tsx     # Récap tarif + méthode paiement
│   │   │   └── TrackingScreen.tsx    # Carte + position livreur + ETA + statut
│   │   └── profile/
│   │       └── (ProfileScreen, HistoryScreen, OrderDetailScreen)
│   │
│   ├── store/
│   │   └── auth.store.ts      # Zustand : tokens SecureStore + profil user
│   │
│   ├── hooks/                 # Hooks React Query (useOrders, useOrderDetail…)
│   ├── services/              # SocketService (tracking WS), LocationService
│   ├── components/            # UI réutilisables (Button, Input, Card, Map…)
│   ├── theme/                 # Colors, typography, spacing, shadows
│   ├── types/                 # order.types.ts, auth.types.ts, user.types.ts
│   ├── utils/                 # Formatage phone, prix FCFA, dates
│   └── i18n/                  # Traductions : Français (fr) · Wolof (wo) · Anglais (en)
│
├── assets/                    # Icônes, splash, adaptive-icon
├── app.json                   # Config Expo : bundle IDs, permissions, extra URLs
└── e2e/                       # Tests Detox (US-C01 → US-C08)
```

### Flux d'authentification

```
[SplashScreen]
    │ check SecureStore (token présent ?)
    ├── Oui + valide ──► AppNavigator (tabs)
    └── Non           ──► PhoneInputScreen
                              │ POST /api/v1/auth/request-otp
                              ▼
                         OTPVerifyScreen
                              │ POST /api/v1/auth/verify-otp
                              │ → access_token stocké en mémoire
                              │ → refresh_token → SecureStore
                              ▼
                         AppNavigator (tabs)
```

### Flux de commande

```
HomeScreen → PickupScreen → DropoffScreen → PackageScreen
                                                  │ POST /estimate → tarif IA
                                                  ▼
                                           ConfirmScreen (paiement)
                                                  │ POST /orders
                                                  ▼
                                           TrackingScreen
                                            [WS /tracking → position GPS en temps réel]
```

---

## Commandes disponibles

```bash
# Développement
npx expo start               # Serveur Expo (QR code, tunnel, LAN)
npx expo start --tunnel      # Tunnel ngrok (réseau différent)
npm run android              # Lancer sur émulateur Android
npm run ios                  # Lancer sur simulateur iOS
npm run web                  # Lancer en mode web (dégradé)

# Build natif (EAS Build)
npx eas build --platform ios     --profile preview
npx eas build --platform android --profile preview
npx eas build --platform all     --profile production

# Qualité
npx tsc --noEmit             # Vérification des types TypeScript

# Tests E2E Detox
npm run test:e2e:build:ios   # Builder l'app iOS pour Detox
npm run test:e2e             # Lancer les tests US-C01→C08 (simulateur iOS)
npm run test:e2e:android     # Lancer les tests sur émulateur Android
```

---

## API / Endpoints utilisés

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/request-otp` | Demande d'OTP SMS |
| `POST` | `/api/v1/auth/verify-otp` | Vérification OTP → tokens |
| `POST` | `/api/v1/auth/refresh` | Renouvellement silencieux du token |
| `GET` | `/api/v1/auth/me` | Profil utilisateur |
| `POST` | `/api/v1/orders/estimate` | Estimation tarif + ETA |
| `POST` | `/api/v1/orders` | Créer une commande |
| `GET` | `/api/v1/orders` | Historique des commandes |
| `GET` | `/api/v1/orders/:id` | Détail d'une commande |
| `PATCH` | `/api/v1/orders/:id/cancel` | Annuler une commande |
| `PATCH` | `/api/v1/orders/:id/rate` | Noter la livraison |
| WS | `ws://…/tracking` | Suivi position livreur en temps réel |

---

## Tests

```bash
# Prérequis : Xcode (iOS) ou Android Studio (Android) installé

# 1. Builder l'application en mode debug pour Detox
npm run test:e2e:build:ios

# 2. Lancer les tests E2E (scénarios US-C01 à US-C08)
npm run test:e2e

# Tests sur Android
npm run test:e2e:build:android
npm run test:e2e:android

# Voir les résultats
# Logs détaillés dans : e2e/artifacts/
```

Les tests utilisent un **mock server Express** (`e2e/helpers/mockServer.ts`) sur le port 3333 qui intercèpte tous les appels HTTP de l'application — aucun backend réel requis.

---

## Déploiement

### EAS Build (Expo Application Services)

```bash
# Installer EAS CLI
npm install -g eas-cli
eas login

# Configurer le projet (une seule fois)
eas build:configure

# Build de prévisualisation (TestFlight / Firebase App Distribution)
eas build --platform ios     --profile preview
eas build --platform android --profile preview

# Build production (App Store / Play Store)
eas build --platform ios     --profile production
eas build --platform android --profile production

# Soumettre aux stores
eas submit --platform ios
eas submit --platform android
```

### Docker (CI headless — build Expo uniquement)

```bash
docker build -f Dockerfile.ci -t yobbul-client-ci .
docker run --rm yobbul-client-ci npx tsc --noEmit
```
