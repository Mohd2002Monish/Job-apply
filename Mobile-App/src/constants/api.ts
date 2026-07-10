// ─── API base URL ────────────────────────────────────────────────────────────
// Single source of truth for the backend origin. The screens previously
// hardcoded `http://localhost:3000`, which only works in a simulator on the
// same machine — a physical device or a deployed build could never reach it.
//
// Override at build/run time with EXPO_PUBLIC_API_URL (Expo inlines any
// EXPO_PUBLIC_* env var into the bundle). Examples:
//   • iOS simulator / web:      http://localhost:3000        (default)
//   • Android emulator:         http://10.0.2.2:3000
//   • Physical device on LAN:   http://<your-mac-lan-ip>:3000
//   • Production:               https://api.recocareer.ai
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';

// Web app origin — used to open flows not yet built natively (e.g. the
// Razorpay/Stripe upgrade checkout) in an in-app browser.
export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') || 'http://localhost:5173';

/** Build a full endpoint URL from a leading-slash path. */
export const api = (path: string) => `${API_BASE_URL}${path}`;
