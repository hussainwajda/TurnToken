# Turn-Token

QR based smart queue management for local businesses. See `PRD_Turn_Token.md` for the full spec, `PRODUCT.md` / `DESIGN.md` for product and visual-system context used by the Impeccable design skill.

## Stack

- `frontend/` — Next.js 16 (App Router, TypeScript, Tailwind v4)
- `backend/` — FastAPI (Python), talks to Supabase with the service-role key
- `supabase/schema.sql` — Postgres schema + RLS policies for the Supabase project

## First-time setup

1. Create a Supabase project, then run `supabase/schema.sql` in its SQL editor.
2. Backend: `cd backend`, create a venv, `pip install -r requirements.txt`, copy `.env.example` to `.env` and fill in `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` from the project's API settings. The backend refuses to start if these are missing. Optional: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (generate with `vapid --gen`, from the `py-vapid` package) to enable browser push — push silently stays off without them.
3. Frontend: `cd frontend`, `npm install`, copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`). Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the same public key as the backend to enable the status page's "Notify me" opt-in.

## Running locally

```
cd backend && .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

## What's implemented so far

**Phase 1 — core token flow**
- Landing page, owner signup (business registration), printable QR poster
- Token issuance on `/join/[businessId]` (scan destination)
- Customer live status ticket at `/status/[tokenId]`
- Owner dashboard at `/dashboard/[businessId]`: queue list, Call Next / Serve / Skip / Restore /
  Cancel, Pause / Resume queue, and a settings page for changing grace timer, hold window,
  counters, and contact details after signup

**Phase 2 — real-time + full state machine + auth**
- Real-time layer: `backend/app/routers/ws.py` exposes `/ws/business/{id}` (owner, authenticated
  via a first-message handshake) and `/ws/token/{id}` (public, same unguessable-id model as the
  REST status endpoint). Both are invalidation-only — a message means "re-fetch," not a payload of
  state — so the dashboard and the customer ticket update in well under a second instead of
  polling. A slow interval poll (~20s) stays as a permanent fallback in case a socket gets stuck.
  This is in-process (`app/services/realtime.py`), matching the state-machine sweep's existing
  single-instance assumption; scale-out to more than one backend process needs a shared pub/sub
  (e.g. Redis) instead.
- Automatic no-show enforcement: a background sweep in `backend/app/services/state_machine.py`
  auto-skips a called token once its business's grace timer elapses, and auto-expires a skipped
  token once the hold window elapses — the owner never makes that call, per the PRD's core pitch.
  Runs off the event loop (`asyncio.to_thread`) so it can't stall requests or open sockets; set
  `RUN_STATE_MACHINE=false` on every backend process but one if you ever run more than one.
- Owner auth via Supabase (email/password): `/signup` creates the account and the business
  together, `/login` signs in and routes to the owner's dashboard. All queue-control endpoints
  (`call` / `serve` / `skip` / `restore`, and the queue read) require the owner's bearer token and
  verify they own that business. Token issuance and the customer's own status/cancel stay
  unauthenticated by design — customers never log in. Duplicate business/email/phone signups and
  more than one business per account are rejected with a 409.

**Phase 3 — notifications + ETA**
- Rolling-average ETA with owner-configured cold-start default and a multi-counter divisor
  (`backend/app/services/eta.py`).
- Browser push: VAPID keys in `.env`, `frontend/public/sw.js` handles delivery and click-to-open,
  and the status page's "Notify me when it's my turn" opts a device in for the almost-up and
  called alerts.
- WhatsApp deep link (`frontend/src/lib/whatsapp.ts`): the free tier has no WhatsApp Business API,
  so nothing is sent automatically — the status page shows a "get notified on WhatsApp" link (when
  the business has a contact phone set) that opens a wa.me chat to the business with the ticket
  number already typed in, per the PRD's free-tier notification channel.

**Hardening**
- The unauthenticated endpoints (issuing a token, cancelling one, subscribing to push) are
  rate-limited per IP (`backend/app/services/ratelimit.py`) against scripted abuse.
- The backend fails fast at startup with a clear error if required Supabase env vars are missing,
  instead of booting into a state where every request silently 500s.

**Phase 4 — polish**
- The owner dashboard now distinguishes "still loading" from "genuinely empty" for the counters
  and waiting-queue panels, and surfaces a dismissible error banner when a queue action (call
  next, skip, restore, cancel, pause/resume) fails instead of failing silently. The counters and
  services pages got the same treatment for their toggle/update actions.

**Phase 5 — testing**
- `backend/tests/`: 74 pytest tests covering the token state machine's auto-skip/auto-expire/
  almost-up sweep (the PRD's highest-risk, highest-value part), the full HTTP token lifecycle
  (issue → call → serve / skip → restore → cancel) via FastAPI's TestClient, owner-auth guards,
  the multi-counter ETA simulation, schema validators, and the rate limiter. Run with
  `cd backend && .venv/Scripts/python -m pip install -r requirements-dev.txt && .venv/Scripts/python -m pytest`.
  Deploy configs and a frontend test suite are still not built.
