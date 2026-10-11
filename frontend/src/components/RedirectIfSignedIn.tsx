"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/supabase/useSession";

/** Sends an already-signed-in owner straight to their dashboard. Renders
 * nothing; a signed-out visitor, or a user with no business yet, just stays
 * on the public page. */
export function RedirectIfSignedIn() {
  const router = useRouter();
  const { session, loading } = useSession();
  const accessToken = session?.access_token;

  useEffect(() => {
    if (loading || !accessToken) return;
    let active = true;
    api
      .getMyBusiness(accessToken)
      .then((business) => {
        if (active) router.replace(`/dashboard/${business.id}`);
      })
      .catch(() => {
        // No business yet or backend unreachable — stay on the public page.
      });
    return () => {
      active = false;
    };
  }, [loading, accessToken, router]);

  return null;
}
