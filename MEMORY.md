# StreetForge Memory

## Decisions

- The first delivery is a **real, focused client-side vertical slice**, rather than an untestable simulation of the full 3-district, multiplayer MMO plan.
- The game uses Babylon.js with a React host. Gameplay files remain framework-independent under `client/src/game/`.
- The game core adopts the Foundry pattern locally: an integer, fixed-step reducer produces state and events; meshes and HUD are projections.
- High-risk scope deliberately excluded from v0.1: online rooms, auth, PostgreSQL persistence, GLB rigs, OSM imports, pointer lock, physics plugins, and live LLM calls.

## Controls

| Input | Action |
|---|---|
| W A S D | Move through the block |
| Space | Quick strike |
| Q | Dash strike |
| 1 | Heavy strike |
| E | Collect nearby shard |
| I | Toggle Armory |

