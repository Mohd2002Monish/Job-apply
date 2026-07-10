---
name: verify
description: Build, run, and drive the Job-apply-app front-end to verify changes end-to-end in a real browser.
---

# Verifying front-end changes

## Build & serve
```bash
cd Front-end && npm run build          # vite build, ~1s
cd Front-end && npm run preview -- --port 4173 --strictPort   # serves dist/ with SPA fallback
```
Note: `preview`/`build` scripts live in `Front-end/package.json`, not the repo root.

## Drive with a browser
No playwright/puppeteer in the repo. Install `puppeteer-core` in the session scratchpad and point it at system Chrome:
`executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`, `headless: 'new'`.

## Simulating an authenticated pro user (no backend needed)
Real auth is OAuth-only, but the app falls back to `localStorage` when the backend (port 3000) is unreachable:
```js
page.evaluateOnNewDocument(u => localStorage.setItem('jaa_user', JSON.stringify(u)),
  { email: 't@e.com', name: 'Test User', picture: '', provider: 'google',
    subscriptionTier: 'pro', role: 'user', onboardingCompleted: true });
```
- `subscriptionTier: 'pro'` is required or you hit the PaymentGate.
- `onboardingCompleted: true` suppresses the onboarding modal.
- `role: 'owner'` unlocks the Admin tab.

## Verifying Mobile-App changes (Expo)
The Expo app also runs on web (react-native-web), which lets you drive it in Chrome:
```bash
cd Back-end && PORT=3001 node index.js                 # own backend instance; uses Atlas Mongo from .env
cd Mobile-App && EXPO_PUBLIC_API_URL=http://localhost:3001 npx expo start --web --port 8081
```
- Use **port 8081** — it's in the backend CORS allowlist (`Back-end/index.js`); other ports get blocked.
- Don't pass `CI=1` to expo start — it disables file watching, so edits never rebundle.
- Mint a real login token (mobile auth is Bearer JWT, key `reco_jwt` in AsyncStorage → localStorage on web):
```bash
cd Back-end && node -e "require('dotenv').config(); const jwt=require('jsonwebtoken');
console.log(jwt.sign({email:'mohd2002monish@gmail.com'}, process.env.JWT_SECRET||process.env.SESSION_SECRET, {expiresIn:'2h'}))"
```
then in puppeteer: `page.evaluateOnNewDocument(t => localStorage.setItem('reco_jwt', t), JWT)`.
- RN `Alert.alert` is a no-op on web — verify effects via network responses, not dialogs. CORS preflights show as 204; filter them when asserting on API responses.
- expo-file-system/expo-sharing flows (e.g. Builder PDF share sheet) are native-only; on web verify the API call and test the share on a simulator.

## Gotchas
- With the backend down the dashboard keeps polling, so `networkidle0` never fires on
  authenticated pages — use `waitUntil: 'domcontentloaded'` plus a 1.5–2s sleep.
- Dashboard routes are `/app/:tab` (jobs, discover, finder, cover-letter, builder,
  analytics, settings, admin); unknown tabs redirect to `/app/jobs`.
- Payment/digest redirects land on `/` with query params (`?upgrade=…`,
  `?importScrapedJobId=…`) and must survive the redirect to `/app/jobs`.
- Front-end unit tests: `cd Front-end && npm test` (node --test, no jsdom).
