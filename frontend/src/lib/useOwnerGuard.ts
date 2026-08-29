"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "./supabase/useSession";
import type { Business } from "./types";

/** Shared guard for every /dashboard/[businessId]/* client page: redirect
 * to /login when signed out, otherwise expose whether this session's user
 * actually owns the business being viewed. */
export function useOwnerGuard(business: Business) {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  const isOwner = session?.user.id === business.owner_id;
  const accessToken = session?.access_token;
  const ready = !sessionLoading && Boolean(session);

  return { session, sessionLoading, isOwner, accessToken, ready };
}
