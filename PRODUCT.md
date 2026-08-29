# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, TypeScript, Tailwind) for the frontend, FastAPI (Python) as the backend service, Supabase for Postgres, authentication, and storage. Chosen directly by the user; not delegated.

## Users

**Customer** — walks into or intends to visit a local shop (clinic, salon, repair shop, walk-in counter). Wants to avoid standing in line, wants an honest wait estimate, and wants a simple way to confirm or cancel their spot. No app install, no login, minimal typing. Interacts almost entirely on a phone, often outdoors or in transit after scanning a QR poster.

**Shop owner** — runs a small business with unpredictable service times and no existing digital tooling. Wants an easy way to manage the line, reduce "how much longer" interruptions, and understand daily footfall. Not necessarily technical.

**Counter operator (secondary)** — operates the queue dashboard on a shop tablet or phone during business hours. May not be technical, so the interface must be extremely simple and usable at a glance while multitasking with in-person customers.

## Product Purpose

Turn-Token is a lightweight, web-based queue management system. Customers scan a printed QR poster to join a queue, track their live position from their own phone, and get alerted when their turn is close. Success means less physical waiting, fewer walked-away customers, and no-show tokens handled automatically and fairly rather than through an owner's judgment call.

## Positioning

Existing queue systems are built for banks and hospitals: dedicated kiosks, display screens, expensive licenses. Turn-Token's mechanism a competitor can't casually copy is the automated no-show state machine (grace timer -> skip -> hold window -> restore/expire) that removes the owner from having to decide whether a late customer keeps their place — the system decides, consistently, every time.

## Operating Context

- Customer flow: scan QR poster -> token issued instantly, no login -> live status page with position and ETA -> "almost up" and "your turn" alerts -> arrives and is served, or is skipped/held/restored per the state machine.
- Owner flow: register business -> configure grace timer, hold window, active counters -> print/display the generated QR poster -> run the queue from a dashboard (Call Next, Skip, Restore, Cancel, Pause) -> review daily analytics.
- The owner dashboard is frequently operated on a shop tablet or phone at a counter, often one-handed and interrupted by in-person customers.
- The customer status page is viewed on a personal phone, frequently outdoors or in variable lighting, while away from the shop.

## Capabilities and Constraints

- No customer app install; no customer login. Each token links to a unique, unguessable status URL.
- Token state machine: Waiting, Called, Serving, Done, Skipped, Held, Restored, Expired, Cancelled. All transitions are system-enforced except the manual owner actions of calling, marking served, and restoring.
- ETA is a rolling average of recent completed service times per business (last ~10-15 tokens), divided by active counters, with an owner-configured cold-start default. Not fixed time slots.
- Real-time position updates target under 3 seconds; MVP notification channels are WhatsApp deep link (wa.me) and browser push, SMS is a paid-tier addition.
- One queue per business for MVP; multi-branch and per-service-type ETA are future scope.
- Free tier carries a "Powered by Turn-Token" footer on the customer status page (acquisition channel); paid tier removes it and adds automated WhatsApp alerts, multiple counters, and full analytics history.
- Out of scope for MVP: payments, multi-business franchise admin, native mobile apps, service catalog/recommendation engine.

## Brand Commitments

Name: Turn-Token. Tagline: "QR based smart queue management for local businesses." No existing logo, palette, or visual assets; visual identity is not yet established.

## Evidence on Hand

No real customer data, testimonials, or case studies yet — this is a pre-launch academic/portfolio project (guide: Prof. Kaustubh Keer). Do not fabricate testimonials, customer logos, or usage metrics; use realistic placeholder/demo data clearly, or empty states, instead.

## Product Principles

1. Zero friction for the customer: no typing, no login, no app install, from QR scan to token in hand.
2. The system, not the owner, makes the no-show call — grace timers and hold windows are configurable, but their enforcement is automatic and consistent.
3. Built for a shop counter, not an enterprise back office: the owner-facing UI must stay legible and operable at a glance, one-handed, mid-interruption.
4. The ETA is honest and adaptive — it reflects the shop's actual live pace, not a static promise.
5. Free tier is a genuine acquisition funnel (visible footer), not a crippled trial.

## Accessibility & Inclusion

Customer-facing pages must work on any modern mobile browser with zero install, at a glance, for users who may be distracted, outdoors, or in a hurry — legible contrast and large touch targets matter more than density here.
