# LAWMA MD — Follow-up (due Fri 2026-07-17)

Source: pitch + demo meeting, Mon 2026-07-13. Full transcript: `MD-meeting-2026-07-13-transcript.txt`.
Verdict: good meeting. MD engaged, gave concrete feedback, asked us to **get back to him Friday**.

## The one thing he actually asked for

> "Think about what modules can be used for community recycling centers — where we can take in waste, register people, weigh it, and give them incentives."

Our current app is designed for the **individual resident**. His whole feedback is that the real operational need is **collection-center / bulk** flows. Friday's deliverable = show we can extend the platform to cover his models, not just the resident MVP.

## What to send Friday

A short addendum (1–2 pages + a couple of mockup frames) covering the two models below. Not a rebuild — a "here's how the platform absorbs this" concept.

### Module A — Community Recycling Center (buy-back)
The real-world flow he runs today (Simpson, Ocean facilities; Thursday community buy-back by weight):
- **Register** a person at the center (walk-up, high volume — 1,000+/day at busy centers).
- **Weigh** incoming recyclables (plastics, paper, cardboard) at the point of drop-off.
- **Reward** = cash or **credit**, claimed **in-app** (he'll fund an account; POS / card / in-app wallet).
- Design constraints he flagged: **queues** and **reward-gaming** at scale — needs an operator-side (staffed) capture flow, not a self-serve resident screen. Think kiosk/operator app + resident wallet, not the individual smart-bin-order UI.

### Module B — Pay-as-you-go Tricycle Compactor + RFID wallet
For dense/narrow-road neighborhoods (Lagos Island, Ebute-Ero already live at ~₦800/building; model seen in Ghana):
- Tricycle compactor carries an **RFID chip + wallet**.
- Resident pays PAYG at pickup (electronic).
- At the **mini transfer station / weighbridge**, the system auto-detects the tricycle, weighs the load, and **auto-docks payment from the wallet** to settle the operator.
- This needs to live on the **same electronic platform** — so our admin dashboard should model: wallets, weighbridge events, per-tricycle ledger.

## Talking points to reinforce (already landed well)
- Admin dashboard traceability: which **PSP** is assigned to a complaining resident → follow-up/accountability. He liked the sort-at-source + PSP-tracking angle.
- Security audit before go-live (PII: addresses, phone numbers) — keep this in the pitch, it signals seriousness.
- Phased pricing (₦100M research → ₦100M build → phase-3 training/maintenance/audit) + multi-state licensing angle — unchanged.

## Open questions to resolve before Friday
- Payment gateway still undecided (demo used **Flutterwave test**) — do we commit to one for the wallet/PAYG story?
- How does resident identity map to a **collection-center** registration (same account, or a lighter walk-up profile)?
- Reward-gaming controls at centers — one concrete mitigation to name in the doc (per-person daily cap? staffed verification?).

## Suggested owners
- Concept doc + mockup frames: Michael / LinqLab design.
- Follow-up scheduling: confirm Friday send channel with MD (has our number).
