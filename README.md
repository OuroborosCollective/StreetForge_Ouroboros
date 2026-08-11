# StreetForge: Neon District

StreetForge ist ein browserbasiertes, neo-noires Third-Person-Action-RPG mit Babylon.js-Rendering, persistenten Charakteren und einer serverautorisierten Open-World-Schicht.

| Bereich | Implementierter Vertrag |
|---|---|
| Spielkern | Feste, deterministische Kampfreduktion, Respawn, Loot, XP und kamera-relative Bewegung. |
| Stadt | Persistente District-Pulse, Karte, NPC-Routinen, Territorien, Zivilisation und Kappa-10-Hz-Kern. |
| Sozial | District-/Gang-/Gruppenchat, Teamfinder, Dungeons, Gruppenbelohnungen und Transferbelege. |
| Ökonomie | Auktionshaus mit Escrow, Kopfgeldmissionen, Share-Bonus und konfigurierbare Premium-Kataloge. |
| Plattform | Android-Touch, WebGL-Fallback, itch.io-Wrapper und ein vorbereiteter externer Serveradapter. |

## Lokaler Start und Validierung

```bash
pnpm dev
pnpm check
pnpm test
pnpm test:e2e
```

Der Stand enthält derzeit 40 Unit-Tests und drei Playwright-Smoke-Tests. Die Smoke-Suite prüft Startscreen, Canvas-Gesundheit, Charakter-Gate und den itch.io-Wrapper.

## Betriebs- und Übergabedokumente

| Thema | Dokument |
|---|---|
| Determinismus und privater Server | `KAPPA_CIVILIZATION.md`, `OPERATIONS.md` |
| City, Territorien und NPCs | `CITY_SYSTEMS.md`, `OPEN_WORLD.md` |
| P2P-Vertrauensgrenzen | `NETWORK_ARCHITECTURE.md` |
| Audio- und Modelllizenzen | `AUDIO_SOURCES.md`, `BABYLON_MODEL_SOURCES.md` |
| itch.io | `ITCHIO_PUBLISH.md` |
| GitHub-Draft-PR-Fluss | `GITHUB_INTEGRATION.md` |

> Der GitHub-Import erzeugt ausschließlich nach der expliziten Bestätigung `PUSH_STREETFORGE_TO_OUROBOROS` einen neuen Branch und einen Draft Pull Request. Er überschreibt keinen Hauptbranch.
