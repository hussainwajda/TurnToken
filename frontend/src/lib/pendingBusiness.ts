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
