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

export function tokenNotifyMessage(businessName: string, position: number): string {
  return (
    `Hi ${businessName}! I'm ticket #${String(position).padStart(3, "0")}. ` +
    `Please notify me on WhatsApp when it's almost my turn or when I'm called.`
  );
}
