# Kappa Civilization Core

StreetForge separates its **Level-A simulation** from rendering and UI. The core advances in exact logical steps of **100 ms** (10 Hz) and represents simulation scalars as validated safe integers at the fixed Kappa scale of **1,000,000**. It does not use wall-clock time, browser input, `Math.random()`, or decimal game state to decide movement, needs, leadership, conflict, voting, or bounty rewards.

| Boundary | Authoritative responsibility |
|---|---|
| NPC core | Collision-aware route updates, rerouting, hunger, wealth, social connection, and safety needs. |
| Faction core | Food reserve, cohesion, legitimacy, leadership replacement, diplomacy, war, peace, and truce posture. |
| Politics | Deterministic vote weights derived from unmet faction needs; no client submits a vote total. |
| Bounties | Mission contracts, funding receipts, balance checks, dungeon-run proof, one-time reward claims. |
| External adapter | Persistent configuration stores an HTTPS endpoint plus the protocol version, tick rate, Kappa scale, tick range, and world hash envelope. |

The current managed deployment keeps the simulation **embedded** and exposes an administrator-controlled switch to `external`. In external mode, the application does not silently duplicate simulation work: it returns a `streetforge-kappa-v1` envelope for the future private server to process and verify. The external runner must preserve the sorted iteration order and submit only state changes that pass the same Kappa contract.

> A continuous real-time 10-Hz loop requires the future private server to own wall-clock pacing. The core itself is intentionally time-source-free so replay, diagnostics, and server handoff remain deterministic.
