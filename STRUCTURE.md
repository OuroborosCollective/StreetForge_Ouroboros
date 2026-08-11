# StreetForge Structure

## Runtime Layers

| Layer | Responsibility | Boundary |
|---|---|---|
| React frame | Canvas-Lebenszyklus, HUD-Overlay, Tastaturhinweise und Zugänglichkeit | Besitzt keine Spielregeln. |
| Babylon scene | Kamera, Lichter, Straßenmesh, Figurenmesh, Partikel und Material-Rendering | Spiegelt nur den Spielzustand. |
| Game world | Player, Enemy, Pickup und ihre Babylon-Knoten | Übersetzt Zustand in sichtbare Transformationswerte. |
| Sim core | `GameState + Intent → NextState + Events` für Kampf, Cooldowns, XP und Loot | Rein, Integer-basiert und testbar. |

## Module Map

```text
client/src/game/
  scene.ts          scene factory, lifecycle and fixed-step bridge
  sim.ts            reducer, state, intents and domain events
  world.ts          player/enemies/pickups with Babylon mesh ownership
  input.ts          semantic keyboard input
  materials.ts      StreetForge material factory and generated texture URLs
  types.ts          UI-facing snapshots
client/src/components/
  GameCanvas.tsx    React picture frame and accessible HUD overlay
```

## Domain Vocabulary

| Term | Meaning |
|---|---|
| Intent | A player request such as `move`, `attack`, `dash` or `heavy`. It never directly sets damage or XP. |
| Tick | A fixed 50ms simulation step. Rendering may run faster but never decides combat values. |
| Event | An explicit fact emitted by the reducer, such as `hit`, `enemyDown`, `lootDropped` or `questComplete`. |
| Snapshot | The slim state presented to the DOM HUD; it contains no Babylon objects. |

## Asset Hints

Use generated textures only on planes and boxes: the wet asphalt repeats over the street plane, the concrete texture repeats over building blocks, the HUD plate underlays the mission card, and the title reference remains a start-cover visual. Characters, cones, lamps, crates and pickups are intentionally constructed from simple readable geometry rather than an unstable GLB pipeline.

