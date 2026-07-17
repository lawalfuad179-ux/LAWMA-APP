# LAWMA MD — Follow-up (Fri 2026-07-17)

Source: pitch + demo meeting with the MD. Transcript: `MD-meeting-2026-07-13-transcript.txt`.
His closing ask, verbatim [31:29]:

> "Think about what modules can be used for community recycling centers. Where we can take in
> waste, register people, weigh it, and give them incentives."

**Status: built, deployed, live.** Not a concept doc — a working module he can use himself.

---

## What to send him

**Live link:** https://lawma-app.vercel.app/center
**Credentials:** sent separately (not in this file).

He can run a real transaction end-to-end: look someone up, weigh their material, credit them.

---

## Module A — Community Recycling Centre (BUILT)

Maps 1:1 onto his four verbs.

| His words | What it does |
|---|---|
| "take in waste" | Operator kiosk at `/center` — staffed counter, tablet-shaped, one screen per resident |
| "register people" | Phone lookup; if unknown, one-step walk-up registration |
| "weigh it" | Tally every material in one go — 5kg metal + 3kg plastic + 2kg paper is **one visit**, with live naira per line and a running total |
| "give them incentives" | Credits the resident's wallet instantly, one itemised receipt handed over |

### The line worth leading with
**The incentive isn't cash — it's their waste bill paying itself.**
Credit lands in the same wallet the app already applies to bills. Bring 6kg of plastic to
Simpson, and a ₦5,000 waste bill becomes ₦3,800. Money stays inside LAWMA's system instead of
going out the door as cash, and it drives bill compliance — the thing the whole pitch is about.

That also means **no payment gateway decision is needed** for this module. (Gateway is only a
question for cash-out, which is a later phase.)

### Second line: the centre is an acquisition channel
He worried this was "designed for individual". The walk-up flow inverts that — someone who has
never heard of the app gets registered at the counter in one step, and later claims the same
account and the credit already sitting in it from their phone. **Every centre onboards residents
onto the platform.**

### His two objections, answered in the build
- **"the rules get cracked"** → 3-layer guard: per-resident 50kg/24h cap, 100kg single-weigh
  plausibility limit, 10-minute re-entry detection. Every weigh-in carries the operator's ID.
- **"there will be long queues"** → the guard **flags, it does not block**. A staffed counter
  can't afford to argue with a resident while fifty people wait, so flagged drop-offs are still
  credited and queued for supervisor review. **Staffing is the control** — which is his own point
  ("it has to be a properly staffed facility"); the software supplies attribution and caps.

### Caveat to say out loud
Per-kg rates in the demo are **placeholders, not LAWMA pricing** (the UI says so). They live in
the database and can be repriced without a code change. He should give us the real rate card.

---

## Module B — Tricycle + RFID weighbridge (NOT built — deliberately)

He raised this as thinking-aloud ("I'm just thinking of how we can use technology to apply to
different models"), not as the ask. Building both properly in the time available meant doing
neither well. Say plainly: Module A is done and usable; Module B is next, and the same ledger
primitives (wallets, weigh events, per-actor attribution) already carry it.

For the conversation: tricycle compactor carries an RFID chip + wallet → resident pays PAYG at
pickup → at the mini transfer station the weighbridge auto-detects the tricycle, weighs the load,
and auto-docks payment from the wallet. Live already at Ebute-Ero (~₦800/building); model seen in
Ghana.

---

## Reinforce (landed well first time)
- Admin dashboard traceability: which PSP is assigned to a complaining resident → accountability.
- Independent security audit before go-live (PII: addresses, phone numbers).
- Phased pricing (₦100M research → ₦100M build → phase-3 training/maintenance/audit) +
  multi-state licensing.

## Still open
- Real buy-back rate card from LAWMA.
- Payment gateway — only needed for cash-out, not for credit. Defer it.
- Cash vs credit: he said "either cash or credit". We've built credit and it's the stronger
  story; worth confirming he's happy with credit-first.

## After the meeting
Revoke the demo access: `npx tsx prisma/revoke-center-demo.ts`
(deactivates the kiosk operators, clears the demo resident's password, drops open sessions;
leaves centres, rates and drop-off history intact.)
