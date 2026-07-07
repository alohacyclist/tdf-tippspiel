import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env.example)')
}

// persistSession + autoRefreshToken keep an active user logged in indefinitely:
// the access token (1 h JWT) is silently refreshed via the refresh token as long
// as the latter is valid (Dashboard → Authentication → Sessions). Only true
// expiry / revocation ends the session -> onAuthStateChange('SIGNED_OUT').
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

const INTENTIONAL_LOGOUT_KEY = 'tdf-intentional-logout'

// Sign out on purpose (Abmelden button). Tags the SIGNED_OUT event so useAuth
// does not mistake it for an expired session and show the expiry banner.
export async function signOut() {
  try {
    sessionStorage.setItem(INTENTIONAL_LOGOUT_KEY, '1')
  } catch {
    // sessionStorage unavailable (private mode) — worst case: banner after logout.
  }
  await supabase.auth.signOut()
}

// True exactly once after an intentional signOut(); consumed on read.
export function consumeIntentionalLogout(): boolean {
  try {
    const flagged = sessionStorage.getItem(INTENTIONAL_LOGOUT_KEY) !== null
    if (flagged) sessionStorage.removeItem(INTENTIONAL_LOGOUT_KEY)
    return flagged
  } catch {
    return false
  }
}
