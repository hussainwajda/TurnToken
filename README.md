# Turn-Token

QR based smart queue management for local businesses. See `PRD_Turn_Token.md` for the full spec, `PRODUCT.md` / `DESIGN.md` for product and visual-system context used by the Impeccable design skill.

## Stack

- `frontend/` — Next.js 16 (App Router, TypeScript, Tailwind v4)
- `backend/` — FastAPI (Python), talks to Supabase with the service-role key
- `supabase/schema.sql` — Postgres schema + RLS policies for the Supabase project

## First-time setup

1. Create a Supabase project, then run `supabase/schema.sql` in its SQL editor.
2. Backend: `cd backend`, create a venv, `pip install -r requirements.txt`, copy `.env.example` to `.env` and fill in `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` from the project's API settings.
3. Frontend: `cd frontend`, `npm install`, copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`).

## Running locally

```
cd backend && .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

## What's implemented so far

**Phase 1 — core token flow**
- Landing page, owner signup (business registration), printable QR poster
- Token issuance on `/join/[businessId]` (scan destination)
- Customer live status ticket at `/status/[tokenId]` (polling, not yet websocket)
- Owner dashboard at `/dashboard/[businessId]`: queue list, Call Next / Serve / Skip / Restore

**Phase 2 (partial) — state machine + auth**
- Automatic no-show enforcement: a background sweep in `backend/app/services/state_machine.py`
  auto-skips a called token once its business's grace timer elapses, and auto-expires a skipped
  token once the hold window elapses — the owner never makes that call, per the PRD's core pitch.
- Owner auth via Supabase (email/password): `/signup` creates the account and the business
  together, `/login` signs in and routes to the owner's dashboard. All queue-control endpoints
  (`call` / `serve` / `skip` / `restore`, and the queue read) require the owner's bearer token and
  verify they own that business. Token issuance and the customer's own status/cancel stay
  unauthenticated by design — customers never log in.

Not yet built: real-time via websockets/Supabase Realtime (currently polling), WhatsApp/push
notifications and live ETA cold-start tuning (Phase 3), analytics dashboard (Phase 4).
