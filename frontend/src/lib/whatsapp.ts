import type { TFunction } from "@/i18n/translate";

/**
 * wa.me deep links, per PRD section 6.5's free-tier notification channel.
 *
 * There's no WhatsApp Business API on the free tier, so nothing here is
 * sent automatically — this only builds a link that opens WhatsApp with a
 * message already typed in, for the customer to send themselves. See
 * `backend/app/services/push.py` for the one channel (browser push) this
 * backend actually delivers proactively.
 */

/** wa.me needs bare digits (country code + number), no "+", spaces, or dashes. */
function toWhatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppLink(phone: string, message: string): string | null {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** The pre-filled message text itself lives in the i18n dictionary
 * (`wa.message`) so it goes out in the customer's language. */
export function tokenNotifyMessage(
  t: TFunction,
  businessName: string,
  position: number,
): string {
  return t("wa.message", {
    business: businessName,
    number: String(position).padStart(3, "0"),
  });
}
