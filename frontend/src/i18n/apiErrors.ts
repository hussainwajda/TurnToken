import { ApiError } from "@/lib/api";
import { MESSAGES, type MessageKey } from "./messages";
import type { TFunction } from "./translate";

// The backend sends English `detail` strings. Translate the known ones by
// exact match; anything else falls through to the caller's localized
// fallback rather than showing English to a Hindi/Marathi reader.
const BY_ENGLISH_TEXT = new Map<string, MessageKey>(
  (Object.keys(MESSAGES) as MessageKey[])
    .filter((key) => key.startsWith("err."))
    .map((key) => [MESSAGES[key].en, key]),
);

/** A localized message for a failed request. `fallbackKey` is used when the
 * error isn't an ApiError or its text isn't one we have a translation for. */
export function describeApiError(
  err: unknown,
  t: TFunction,
  fallbackKey: MessageKey,
): string {
  if (err instanceof ApiError) {
    const key = BY_ENGLISH_TEXT.get(err.message);
    if (key) return t(key);
  }
  return t(fallbackKey);
}
