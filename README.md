# SplitEasy

SplitEasy is a cross-platform expense-splitting app. Create groups with friends or roommates, log shared expenses, split them evenly or custom, track running balances per member, and settle up — all synced in real time.

Built with Expo, so the same codebase ships to iOS, Android, and the web.

## Features

- Email/password and Google sign-in (Firebase Auth)
- Create groups and manage members
- Add expenses with flexible splits (equal / custom) and category icons
- Multi-currency support with FX conversion against a group's base currency
- Per-group balances with debt simplification (fewer transactions to settle up)
- Settlement recording and history
- Notifications and activity feed
- Light/dark theme support

## Tech stack

| Layer            | Choice                                             |
|-------------------|-----------------------------------------------------|
| Framework         | [Expo](https://expo.dev) (React Native + React Native Web) |
| Language          | TypeScript                                         |
| UI kit            | [Tamagui](https://tamagui.dev)                     |
| Navigation        | In-app state (no router library)                   |
| Backend           | [Firebase](https://firebase.google.com) — Authentication + Firestore |
| Auth (Google)     | `expo-auth-session` / `expo-web-browser` (manual OAuth flow → Firebase credential) |
| Local persistence | `@react-native-async-storage/async-storage`        |
| Fonts             | `@expo-google-fonts/inter`                         |

## Project structure

```
src/
  auth/        Firebase email/password + Google sign-in logic
  components/  Reusable feature components (split editor, pickers, etc.)
  screens/     Screens grouped by feature (Auth, Groups, Expenses, Profile, ...)
  services/    Firestore data access (groups, expenses, balances, settlements, fx)
  theme/       Theme provider, colors, tokens
  ui/          Shared design-system primitives (buttons, cards, inputs, ...)
  types/       Shared TypeScript types
  utils/       Pure helper functions (split math, debt simplification, dates, ...)
App.tsx        Root component / simple tab navigation
firebase.ts    Firebase app + Auth + Firestore initialization
```

## Prerequisites

- Node.js 18+
- npm
- A Firebase project with **Authentication** (Email/Password and Google providers enabled) and **Firestore** set up
- A Google Cloud OAuth 2.0 **Web** client ID (for Google sign-in) — same project as Firebase
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (invoked via `npx`, no global install required)

## Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone <repo-url>
   cd split-easy
   npm install
   ```

2. Copy the env template and fill in your Firebase + Google OAuth values:

   ```bash
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   EXPO_PUBLIC_FIREBASE_APP_ID=

   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
   ```

   - Firebase values come from **Project settings → General → Your apps** in the Firebase console.
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is the OAuth **Web** client ID from Google Cloud Console → APIs & Services → Credentials (used for both web and native sign-in in this app).
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` is only needed if you build a native iOS client.

3. In Google Cloud Console, under the Web OAuth client's **Authorized redirect URIs**, add the redirect URI(s) the app will use (see [Deploying](#deploying-to-vercel) below for the production one; for local web dev it's whatever `expo start --web` prints, typically `http://localhost:8081/--/auth/callback`).

## Running locally

```bash
npm start        # Expo dev server — choose a platform from the CLI menu
npm run web       # Run in the browser
npm run ios       # Run in the iOS simulator (macOS only)
npm run android   # Run in the Android emulator
```

## Building for the web

```bash
npm run build
```

Exports a static build to `dist/`.

## Deploying to Vercel

This is an Expo app, not Next.js, so the build has to be pointed at explicitly. A [vercel.json](vercel.json) is already checked in with the build command, output directory, and an SPA rewrite (needed because there's no server-side routing and the OAuth callback path isn't a real static file).

1. Import the repo into Vercel.
2. Add every `EXPO_PUBLIC_*` variable from your `.env` to the Vercel project's Environment Variables (Production and Preview) — `.env` is gitignored, so nothing is inherited automatically.
3. Deploy, and note the resulting domain (e.g. `https://split-easy.vercel.app`).
4. Whitelist that domain:
   - **Firebase Console** → Authentication → Settings → Authorized domains → add the domain.
   - **Google Cloud Console** → Credentials → the Web OAuth client → add `https://<domain>` to Authorized JavaScript origins and `https://<domain>/--/auth/callback` to Authorized redirect URIs.
   - If the OAuth consent screen is still in "Testing" mode, add your demo viewers as test users, or publish the app.
5. Re-deploy if you added env vars after the first deploy, then test Google sign-in on the live URL.

## Environment variables reference

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth client ID for native iOS sign-in |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth client ID for web (and proxied native) sign-in |
