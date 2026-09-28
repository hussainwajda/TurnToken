import type { User } from "@supabase/supabase-js";
import type { BusinessCreateInput } from "./types";

const KEY = "turn-token:pending-business";

export function savePendingBusiness(form: BusinessCreateInput) {
  localStorage.setItem(KEY, JSON.stringify(form));
}

export function readPendingBusiness(): BusinessCreateInput | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BusinessCreateInput;
  } catch {
    return null;
  }
}

export function clearPendingBusiness() {
  localStorage.removeItem(KEY);
}

/**
 * Same draft as `readPendingBusiness`, but sourced from the user's own auth
 * metadata instead of this browser's localStorage. Signup stashes the draft
 * there too, so it survives confirming the email in a different browser or
 * device than the one the signup form was filled out in — the case where
 * localStorage has nothing.
 */
export function readPendingBusinessFromUser(
  user: User | null | undefined,
): BusinessCreateInput | null {
  const pending = user?.user_metadata?.pending_business;
  if (!pending || typeof pending !== "object") return null;
  return pending as BusinessCreateInput;
}
