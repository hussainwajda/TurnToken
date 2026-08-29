<!-- SEED: established with the user before implementation; re-run /impeccable document once there is enough built UI to capture the actual tokens and components. -->

---
name: Turn-Token
description: QR based smart queue management for local businesses
colors:
  pine: "#144D45"
  pine-deep: "#0C3630"
  marigold: "#DC8A2E"
  marigold-deep: "#B96F1E"
  terracotta: "#B44430"
  cream: "#F8F3EA"
  cream-panel: "#F1E9DA"
  ink: "#231F1A"
  ink-soft: "#5B5347"
  line: "#E1D6C2"
typography:
  display:
    fontFamily: "Fraunces, 'Iowan Old Style', Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 4.75rem)"
    fontWeight: 480
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  ticket-number:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(4rem, 22vw, 8rem)"
    fontWeight: 560
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 450
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.cream}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.pine-deep}"
  button-accent:
    backgroundColor: "{colors.marigold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  button-accent-hover:
    backgroundColor: "{colors.marigold-deep}"
---

# Design System: Turn-Token

## Overview

**Creative North Star: "The Counter Ticket"**

Turn-Token borrows its visual logic from the paper take-a-number stub at a bakery or repair counter: a single bold number, warm cream stock, a printed-but-precise feel. It is not a nostalgia pastiche and not a kiosk-clock digital readout — it's that physical object rebuilt with quiet, contemporary craft so it works equally well printed on an A4 poster and glowing on a phone screen at dusk.

The palette stays warm and low-saturation everywhere except the two moments that must interrupt: the marigold "your turn" state and the terracotta "skipped" state. Everywhere else, one deep pine green carries the brand. Layout is flat and confident — this is an Operate surface for a shop counter and a Persuade-adjacent surface for a waiting customer, never a dashboard-template SaaS screen. No purple-to-blue gradients, no icon-tile-above-heading cards, no generic hero-metric stat rows.

**Key Characteristics:**
- One dominant number (the queue position / ticket number) as the page's visual anchor on every customer-facing screen.
- Warm cream paper-stock background, never stark white or cold gray.
- A single confident accent (pine) for brand and primary action; marigold and terracotta are reserved, state-only colors, not decoration.
- Flat surfaces with tonal layering instead of card-on-card nesting; a perforated-edge motif (the ticket stub) is the one signature device, used sparingly.

## Colors

Warm, low-saturation, paper-and-ink character with two reserved alert hues.

### Primary
- **Pine** (`#144D45`): brand color. Primary buttons, links, active nav, the QR frame, headline accents. Deepens to **Pine Deep** (`#0C3630`) on hover/press.

### Secondary
- **Marigold** (`#DC8A2E`): reserved for "your turn now" / called state only — the token glow, the call banner, the "almost up" badge. Never used decoratively. Deepens to **Marigold Deep** (`#B96F1E`) on hover/press for owner-facing call buttons.

### Tertiary
- **Terracotta** (`#B44430`): reserved for skipped/expired/error state only — skip badges, destructive confirmations, form errors.

### Neutral
- **Cream** (`#F8F3EA`): base page background, both customer and owner surfaces.
- **Cream Panel** (`#F1E9DA`): one step deeper than Cream; used for the queue-list surface and other tonal layering instead of shadowed cards.
- **Ink** (`#231F1A`): primary text. Warm near-black, never pure `#000`.
- **Ink Soft** (`#5B5347`): secondary text, captions, timestamps — tinted from Ink, never plain gray.
- **Line** (`#E1D6C2`): dividers and hairline borders between queue rows.

### Named Rules
**The One Alert Color Rule.** Marigold means "called, act now." Terracotta means "skipped/error." Neither appears anywhere else on the page — not in illustration, not in charts, not as a decorative accent — so their meaning stays instantly legible to a distracted customer or a mid-rush shop owner.

## Typography

**Display Font:** Fraunces (with Iowan Old Style, Georgia, serif)
**Body Font:** Manrope (with system-ui, sans-serif)

**Character:** Fraunces' warm, slightly humanist serif carries the "printed ticket" feeling on headlines and the giant queue number; Manrope stays clean and neutral underneath it for anything that has to be read quickly — forms, dashboard rows, status labels.

### Hierarchy
- **Ticket Number** (weight 560, `clamp(4rem, 22vw, 8rem)`, line-height 0.95, tabular numerals): the customer's live queue position. Appears exactly once per status page, dead center, nothing competing with it.
- **Display** (weight 480, `clamp(2.5rem, 6vw, 4.75rem)`, line-height 1.02, tracking -0.01em): page-level headlines on the landing and onboarding screens.
- **Title** (weight 600, 1.5rem, line-height 1.2): section headings inside the owner dashboard and forms.
- **Body** (weight 450, 1rem, line-height 1.55, measure 65-75ch): paragraphs, form helper text, status page copy.
- **Label** (weight 600, 0.8125rem, tracking 0.01em, sentence case — never uppercase-as-decoration): field labels, table headers, status badges.

### Named Rules
**The Single Number Rule.** Fraunces at the Ticket Number size is used for exactly one element per screen: the customer's own position. It is never reused as a generic decorative display face elsewhere, which is what keeps it feeling earned rather than templated.

## Layout

Single-column, generous, centered composition on customer-facing pages (status page, join page) — this is a phone-in-hand surface, so the ticket number and next action must be reachable without scrolling on a 375px viewport. The owner dashboard uses a two-zone layout: a persistent queue list (flat rows on Cream Panel, divided by Line hairlines, no per-row card shadow) alongside a control rail (Call Next / Skip / Restore / Pause) that stays reachable one-handed on a tablet held in the crook of an arm. Container max-width 640px for reading/forms, 960px for the dashboard. Spacing rhythm: 8/16/24/40/64px steps; more space above a heading than below it.

## Elevation & Depth

Mostly flat with tonal layering (Cream vs. Cream Panel) rather than drop shadows. The one exception is a soft ambient lift under the primary "your turn" ticket card and the printable QR poster preview, signaling "this is the one physical/important artifact on the page."

### Shadow Vocabulary
- **ambient-ticket** (`0 12px 32px rgba(20, 77, 69, 0.14)`): under the customer's ticket card and the QR poster preview only.

### Named Rules
**The Flat-Counter Rule.** Queue rows, form fields, and dashboard panels sit flush on their tonal layer. Shadows are reserved for the two physical artifacts in the product (the ticket, the poster) — never applied to routine UI chrome.

## Shapes

Soft-rounded but restrained: 8px on inputs and buttons, 12px on panels and the ticket card, 20px on the QR poster frame. No pill buttons, no fully circular avatars-as-decoration. The one signature geometry is a perforated edge — a repeating small-circle cutout — along the top of the customer ticket card, echoing a tear-off stub without literal illustration.

## Components

### Buttons
- **Shape:** 8px radius, no pill shapes.
- **Primary:** Pine background, Cream text, 14px/28px padding, weight 600 label. Used for the customer's main action and the owner's confirmations.
- **Accent (Call Next):** Marigold background, Ink text — the one owner-facing button allowed the alert color, since "call next" is the moment that alert color exists to signal.
- **Hover / Focus:** background deepens one step (Pine Deep / Marigold Deep); focus-visible ring is a 2px Pine ring offset 2px, never a default blue browser ring.
- **Ghost/Secondary:** transparent background, 1px Line border, Ink text; used for Skip/Cancel/secondary actions.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Cream Panel on Cream page background (tonal layering, not a shadow).
- **Shadow Strategy:** none, except the ambient-ticket treatment on the customer's own ticket card (see Elevation).
- **Border:** none on standard panels; 1px Line border only on the ticket card to define its edge against the ambient shadow.
- **Internal Padding:** 24px standard, 40px on the ticket card.

### Inputs / Fields
- **Style:** Cream background, 1px Line border, 8px radius, Ink text, Manrope.
- **Focus:** border shifts to Pine, 2px Pine focus ring offset 2px.
- **Error:** border and helper text shift to Terracotta; icon-free, text-first error messaging.

### Navigation
- Owner dashboard uses a minimal top bar: business name (Manrope, weight 600) left, Pause Queue toggle and profile right. No sidebar for MVP's single-queue scope. Customer pages carry no navigation chrome at all — just the ticket and, where relevant, the "Powered by Turn-Token" footer link (free tier).

### The Ticket Stub (signature component)
The customer's live status card: Cream Panel background, 12px radius, perforated top edge, ambient-ticket shadow, the Ticket Number centered, status label (Label type) above it, ETA and "notify me" affordance below. This is the one component in the system allowed real visual presence; everything else stays quiet so this reads as the page's purpose.

## Do's and Don'ts

### Do:
- **Do** keep marigold and terracotta strictly state-bound (called/skipped), never decorative.
- **Do** center the Ticket Number as the single largest, most confident element on every customer-facing screen.
- **Do** use tonal layering (Cream / Cream Panel) instead of drop-shadowed cards for routine structure.
- **Do** self-host Fraunces and Manrope via `next/font`; never fall back silently to system sans.

### Don't:
- **Don't** use a purple-to-blue gradient, gradient text, or a kicker/eyebrow label above headings.
- **Don't** wrap the queue list or dashboard panels in nested cards.
- **Don't** use pure black (`#000`) or plain gray for any text; tint from Ink.
- **Don't** introduce a third alert hue; the system has exactly two (marigold, terracotta).
