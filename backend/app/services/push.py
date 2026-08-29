"""Browser push delivery, per PRD section 6.5's "browser push" channel.

WhatsApp is a customer-initiated deep link (see the frontend status page)
since the free tier has no WhatsApp Business API access; push is the one
channel this backend can actually deliver proactively.
"""

import json
import logging

from pywebpush import WebPushException, webpush
from supabase import Client

from app.config import get_settings

logger = logging.getLogger("turn_token.push")


def send_push_to_token(supabase: Client, token_id: str, title: str, body: str) -> None:
    settings = get_settings()
    if not settings.vapid_private_key:
        return

    subs = (
        supabase.table("push_subscriptions")
        .select("*")
        .eq("token_id", token_id)
        .execute()
        .data
        or []
    )

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
                },
                data=json.dumps({"title": title, "body": body}),
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": f"mailto:{settings.vapid_contact_email}"},
            )
        except WebPushException as exc:
            logger.warning("push delivery failed for token %s: %s", token_id, exc)
            if exc.response is not None and exc.response.status_code in (404, 410):
                supabase.table("push_subscriptions").delete().eq("id", sub["id"]).execute()
