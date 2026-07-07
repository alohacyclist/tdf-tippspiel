import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { consumeIntentionalLogout, supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  expired: boolean;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expired, setExpired] = useState(false);
  const hadSession = useRef(false);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, status, role")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) hadSession.current = true;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, next) => {
        if (next) {
          hadSession.current = true;
          setExpired(false);
        } else if (event === "SIGNED_OUT") {
          // A session vanished: expiry / revocation, unless the user hit Abmelden.
          setExpired(hadSession.current && !consumeIntentionalLogout());
          hadSession.current = false;
        }
        setSession(next);
        await loadProfile(next?.user.id);
      },
    );
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(
    () => loadProfile(session?.user.id),
    [loadProfile, session],
  );

  return { loading, session, profile, expired, refreshProfile };
}
