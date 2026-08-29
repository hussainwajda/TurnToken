# Product Requirements Document: Turn-Token

**Product name:** Turn-Token
**Tagline:** QR based smart queue management for local businesses
**Document version:** 1.0
**Date:** August 22, 2026
**Prepared by:** Hussain Wajdawala, Kunal Bhavsar, Sujal Sahu
**Guide:** Prof. Kaustubh Keer
**Status:** Draft for development

---

## 1. Overview

Turn-Token is a lightweight, web based queue management system for small local businesses such as clinics, salons, repair shops, and other walk in service counters. Customers scan a printed QR poster to join a queue, track their live position from their own phone, and get alerted when their turn is close. No app install is needed for customers, and no special hardware is needed for the shop.

The core differentiator is fair, automated handling of no show customers through a token state machine, so the queue never stalls and the shopkeeper never has to make an awkward judgment call.

---

## 2. Problem statement

Small businesses that serve walk in customers have no affordable way to manage waiting crowds. Existing queue systems are built for banks and hospitals, requiring dedicated kiosks, display screens, and expensive licenses that are out of reach for a local shop.

As a result these businesses run on a first come, physically present basis. Customers waste hours waiting on premises, staff are repeatedly interrupted with "how much longer," and a meaningful share of potential customers leave when they see a crowd. Customers who informally take a verbal turn and then disappear disrupt the whole flow, since there is no systematic way to skip, restore, or expire that turn fairly.

---

## 3. Goals and success metrics

| Goal | Metric | Target for MVP |
|---|---|---|
| Reduce physical waiting time | Average time customer spends physically at the shop before being served | Reduce by 40 percent or more versus baseline |
| Reduce walked away customers | Percentage of queue joins that end in a served token vs abandoned | Above 85 percent completion rate |
| Handle no shows fairly | Percentage of skipped tokens successfully restored within hold window | Above 60 percent |
| Owner adoption ease | Time from QR scan to first token issued during onboarding | Under 2 minutes |
| System reliability | Real time position update latency | Under 3 seconds |

---

## 4. Target users

**Primary persona, the Customer**
Walks into or intends to visit a local shop. Wants to avoid standing in line, wants an honest wait time estimate, and wants a simple way to confirm or cancel their spot.

**Primary persona, the Shop Owner**
Runs a small business with unpredictable service times and no existing digital tooling. Wants an easy way to manage the line, reduce interruptions, and understand daily footfall patterns.

**Secondary persona, Staff or Counter Operator**
Operates the queue dashboard on a shop tablet or phone during business hours. May not be technical, so the interface must be extremely simple.

---

## 5. User stories

1. As a customer, I want to scan a QR code and instantly receive a token, so that I do not need to download an app or stand physically in line.
2. As a customer, I want to see my live position and an honest ETA, so that I can plan my time away from the shop.
3. As a customer, I want to be alerted when my turn is close, so that I can return in time.
4. As a customer, I want a grace period if I am slightly late, so that I am not unfairly pushed to the back.
5. As a shop owner, I want a simple dashboard to call, skip, or restore tokens, so that I can manage the queue without extra staff.
6. As a shop owner, I want daily analytics on footfall and no show rate, so that I can make informed staffing decisions.
7. As a shop owner, I want to configure grace time and hold window per my business type, so that the system matches how my shop actually runs.

---

## 6. Functional requirements

### 6.1 Business registration and QR module
- Owner can sign up with business name, category, and contact details.
- Owner can configure grace timer duration, hold window duration, and number of active counters.
- System generates a unique QR code tied to the business, downloadable as a printable poster.

### 6.2 Token issuance module
- Scanning the QR code issues a new token with the next available queue position.
- No login is required for the customer to receive a token.
- Each token links to a unique, unguessable live status URL.

### 6.3 Live queue and ETA module
- Customer status page shows live position and a dynamically updated estimated wait time.
- ETA is computed from a rolling average of recent completed service times for that business, described fully in section 9.
- Position updates propagate to all connected clients within 3 seconds of any queue change.

### 6.4 Token state machine module
- Implements the states Waiting, Called, Serving, Done, Skipped, Held, Restored, Expired, and Cancelled.
- Full transition rules are defined in section 8.

### 6.5 Notification module
- Sends an "almost up" alert when a customer is within a configurable number of positions from being called.
- Sends a "your turn now" alert when a token is called.
- Delivery channels for MVP: WhatsApp deep link (wa.me) and browser push. SMS is a paid tier addition.

### 6.6 Owner dashboard and analytics module
- Shows the live queue with current token being served.
- Provides one tap controls: Call Next, Skip, Restore, Cancel, Pause Queue.
- Shows daily statistics: customers served, average wait time, peak hours, no show rate.

### 6.7 Static and account pages
- Business profile page, basic settings page, and a simple owner login (email and password, or magic link).

---

## 7. Non functional requirements

| Category | Requirement |
|---|---|
| Performance | Queue position updates delivered to clients within 3 seconds via WebSocket |
| Scalability | A single business queue should support at least 200 concurrent tokens without degradation |
| Availability | Target 99 percent uptime for MVP, hosted on managed platforms |
| Security | Owner authentication required for all queue control actions. Customer tokens use unguessable identifiers, not sequential IDs |
| Privacy | Customer phone numbers, if collected for notifications, are not shared with any other business or third party |
| Usability | Customer flow from QR scan to token issued must require zero typing wherever possible |
| Portability | Customer facing pages must work on any modern mobile browser without installation |

---

## 8. Token state machine

| From state | Trigger | To state |
|---|---|---|
| (new) | Customer scans QR | Waiting |
| Waiting | Owner calls next | Called |
| Called | Owner marks served | Serving then Done |
| Called | Grace timer expires with no arrival | Skipped |
| Skipped | Customer arrives within hold window, owner restores | Restored, reinserted as next up |
| Skipped | Hold window lapses with no arrival | Expired |
| Waiting | Customer cancels | Cancelled |
| Restored | Owner calls again | Called |

The system enforces every transition automatically except the manual owner actions of calling, marking served, and restoring. This is intentional: the owner should never have to decide whether a no show customer gets to keep their place, the system decides based on the configured hold window.

---

## 9. Estimated wait time logic

Turn-Token does not use fixed time slots. Wait time is computed live using a rolling average of recent service durations for that specific business.

**Formula**

```
Estimated wait for a token = (number of tokens ahead in queue) / (active counters) * (rolling average service time)
```

**Rolling average**
The system tracks the actual duration from Called to Done for the last N completed tokens, for example the last 10 to 15. This average updates continuously through the day, so the estimate adapts to the shop's actual current pace rather than a historical average from earlier in the day.

**Cold start**
On first use, or first thing in the morning before any tokens are completed, the system falls back to an owner configured default service time, for example 15 minutes for a salon or 8 minutes for a repair drop off. It switches to the live rolling average once enough real data exists.

**Multiple counters**
If a business runs more than one active counter or staff member, the divisor in the formula accounts for parallel service capacity, so wait time is not simply people ahead multiplied by average time.

**Per service type, planned for a later phase**
Businesses offering distinct service types with different durations can tag each token by type and maintain a separate rolling average per type, giving a more accurate ETA for each specific customer.

---

## 10. Data model overview

**Business**
id, name, category, grace timer minutes, hold window minutes, active counters, default service time minutes, created at

**Counter**
id, business id, label, active flag

**Token**
id, business id, position number, status, created at, called at, served at, skipped at, restored at, expired at, service type (optional)

**Notification log**
id, token id, channel, type (almost up or called), sent at, delivery status

**Daily analytics snapshot**
id, business id, date, customers served, average wait minutes, peak hour, no show count, no show rate

---

## 11. API surface, indicative

| Endpoint | Method | Purpose |
|---|---|---|
| /api/business | POST | Register a new business |
| /api/business/:id/qr | GET | Retrieve QR code image for a business |
| /api/business/:id/token | POST | Issue a new token, called on QR scan |
| /api/token/:id/status | GET | Live status for a specific token |
| /api/business/:id/queue | GET | Full current queue, owner view |
| /api/token/:id/call | POST | Owner calls this token next |
| /api/token/:id/serve | POST | Owner marks token as served |
| /api/token/:id/skip | POST | System or owner marks token skipped |
| /api/token/:id/restore | POST | Owner restores a held token |
| /api/business/:id/analytics | GET | Daily analytics for the business |

Real time updates for queue position are delivered over a WebSocket channel scoped per business, separate from the REST endpoints above.

---

## 12. Module wise and phase wise plan

The plan below assumes a three person team working across roughly ten weeks, structured as five phases. Each phase ends with a working, demoable increment rather than a big bang integration at the end.

### Phase 0: Setup and design, week 1
- Finalize tech stack, repository structure, and coding conventions.
- Design data model and API contract.
- Set up Supabase project, Next.js frontend skeleton, and backend service skeleton.
- Design the token state machine diagram and get guide sign off.

**Deliverable:** empty but deployed skeleton app, schema created, team can run the project locally.

### Phase 1: Core token flow, weeks 2 to 3
- Business registration and QR generation module.
- Token issuance on QR scan.
- Basic live status page showing static position, no real time yet.
- Basic owner dashboard listing the queue with manual refresh.

**Deliverable:** a customer can scan a QR and get a token, an owner can see the queue and call the next token manually.

### Phase 2: Real time and the state machine, weeks 4 to 5
- Integrate WebSocket layer for live position updates.
- Implement the full token state machine: Called, grace timer, Skipped, Held, Restored, Expired.
- Owner dashboard gets Call Next, Skip, Restore, Cancel controls.

**Deliverable:** the no show handling flow works end to end, this is the technical core of the project and the main demo scenario.

### Phase 3: Notifications and ETA, weeks 6 to 7
- WhatsApp deep link and browser push notifications for almost up and called alerts.
- Rolling average ETA calculation, with cold start default.
- Multiple counter support in the ETA formula.

**Deliverable:** customers receive real alerts, ETA reflects the shop's actual pace.

### Phase 4: Analytics and polish, week 8
- Daily analytics dashboard: customers served, average wait, peak hours, no show rate.
- UI polish, responsive design pass, empty and error states.
- Basic owner authentication and settings page.

**Deliverable:** a presentable, demo ready product.

### Phase 5: Testing, deployment, and documentation, weeks 9 to 10
- End to end testing of the full customer and owner flows.
- Deploy frontend to Vercel and backend to Railway or Render.
- Write the README, architecture diagram, and a short demo video for the GitHub repository.
- Prepare the final presentation and synopsis alignment.

**Deliverable:** publicly deployed, demoable product with a portfolio ready GitHub repository.

### Suggested team split, adjust as needed
- **Member A:** frontend, customer facing pages, QR scan flow, live status page.
- **Member B:** backend, API layer, token state machine, database schema.
- **Member C:** real time layer, notifications, analytics, deployment.

All three should pair on the state machine logic in Phase 2 since it is the highest risk, highest value part of the system.

---

## 13. Monetization model, for future scope discussion

- **Free tier:** basic queue, live position tracking, capped daily tokens, "Powered by Turn-Token" footer on the status page.
- **Paid tier, indicative range 299 to 999 rupees per month:** automated WhatsApp alerts beyond the free deep link, multiple counter support, full analytics history, footer removed.
- The free tier's footer acts as an organic acquisition channel, every customer who sees it is a soft referral to the next shop.
- A flat retainer pitched cold to a small business rarely works. Freemium plus a visible daily value (fewer walked away customers, fewer interruptions) is what earns the eventual upgrade.

---

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Shop owners hesitant to adopt anything digital | Keep onboarding under 2 minutes, offer to help print and set up the first QR poster in person |
| Customers do not scan the QR out of habit | Staff assisted onboarding for the first few customers during soft launch, clear signage |
| WhatsApp Business API costs scale with paid notification volume | Default to free wa.me deep links for MVP, treat automated API messaging as a clearly priced paid feature |
| Real time layer adds complexity under time pressure | Build Phase 1 with manual refresh first, add WebSockets only once the core flow is proven in Phase 2 |
| Grace timer and hold window defaults do not fit every business type | Make both fully configurable per business during setup |

---

## 15. Out of scope for MVP

- Payment processing or deposit collection.
- Admin panel for managing multiple businesses under one franchise.
- Native mobile apps, the product is web only by design.
- Recommendation engine or service catalog, Turn-Token manages queues, it does not list or sell services.

---

## 16. Assumptions

- Customers have a smartphone with a camera capable of scanning a QR code.
- The business has a stable internet connection at the counter for the owner dashboard.
- One queue per business for MVP, multi branch support is future scope.

---

## 17. Glossary

**Token:** a single customer's place in the queue, identified by a unique link, not a physical ticket.
**Grace timer:** the configurable window after a token is called during which the customer can still arrive before being skipped.
**Hold window:** the configurable window after a skip during which a customer can still be restored to their place.
**Rolling average:** the average service time computed from the most recent N completed tokens, not the full historical average.

---

## 18. References

1. Little, J. D. C. (1961). A Proof for the Queuing Formula: L = lambda W. Operations Research, 9(3), 383 to 387.
2. Gross, D., Shortle, J. F., Thompson, J. M., and Harris, C. M. (2008). Fundamentals of Queueing Theory (4th ed.). Wiley.
3. Maister, D. H. (1985). The Psychology of Waiting Lines. In The Service Encounter, Lexington Books.
4. Next.js Official Documentation, https://nextjs.org/docs
5. Socket.IO Documentation, https://socket.io/docs/
6. Supabase Documentation, https://supabase.com/docs
