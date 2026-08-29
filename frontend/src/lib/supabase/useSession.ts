"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "./client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const timeout = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    }, 0);

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (active) setSession(nextSession);
      },
    );

    return () => {
      active = false;
      clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
