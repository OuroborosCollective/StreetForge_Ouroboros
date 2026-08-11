# Game Plan: StreetForge — Neon District

## Scope

StreetForge ist ein spielbarer, clientseitiger Third-Person-Vertical-Slice. Der Slice belegt den Kernloop **Straße erkunden → Gegner besiegen → Beute und XP erhalten → ausrüsten → District-Ziel abschließen**. Er stellt keine Multiplayer-, Account- oder Persistenz-Behauptung auf; diese gehören zur späteren Foundry-Ausbaustufe.

## Risk Tasks

### 1. Dritte-Person-Kamera und beweglicher Player

- **Why isolated:** Eine Kamera, die an einer Bewegungseinheit hängt, kann bei Eingabe, Zoom und Szenen-Updates unlesbar werden oder den Player verdecken.
- **Approach:** Eine stabile ArcRotateCamera folgt der XZ-Position des Players mit sanfter Interpolation. Die Kamera bleibt auf den zentralen Straßenkorridor begrenzt; WASD wird in kamerarelativem XZ-Raum zu semantischen `move`-Intents umgesetzt.
- **Verify:** Gedrücktes W bewegt die Figur entlang der sichtbaren Straße; A/D wirken relativ zur Kamera; der Player bleibt sichtbar, bei freier Bewegung entsteht kein Kamerasprung und beim Loslassen stoppt die Figur unmittelbar.

### 2. Deterministischer Kampf- und Fortschritts-Reducer

- **Why isolated:** Die Foundry-Spezifikation verlangt, dass Kampf und Progression nicht aus verstreuten Mesh-Callbacks entstehen. Ein sichtbares Ergebnis muss aus explizitem Zustand und Intent folgen.
- **Approach:** Ein kleiner reiner TypeScript-Reducer verarbeitet Integer-Werte für HP, Stamina, Cooldowns, XP, Kills und Loot. Der Render-Loop erzeugt nur zeitdiskretisierte Inputs; UI und Babylon-Meshes spiegeln anschließend den Zustand.
- **Verify:** Jeder ausgelöste Angriff reduziert nur ein gültiges Ziel, Cooldowns blocken Wiederholung, ein Kill erhöht XP und bringt einen Loot-Drop hervor. Bei gleicher Startlage und gleicher Intent-Folge entsteht derselbe Status.

## Main Build

Der Slice enthält eine prozedural aus einfachen Babylon-Meshes gebaute, spielbare Nachtstraße mit Fassaden, Bordsteinen, Straßenlampen, Kisten und Hindernissen. Der Player kämpft gegen drei Gang-Mitglieder, nutzt Schlag, Sprintstoß und schwere Aktion, sammelt fallengelassene Shards und schließt den Auftrag „Sichere den Block“ ab. Das DOM-HUD zeigt ausschließlich Gesundheit, Stamina, Ziel, Minimap, Fähigkeitsslots, Loot und Fortschritt. Eine taktische Ausrüstungskarte kann direkt im Spiel geöffnet werden.

- **Assets:**
  - `streetforge-reference` als spielbares Titel-/Atmosphärenbild im Start-Overlay.
  - `streetforge-wet-asphalt` als wiederholte 2m-Straßentextur.
  - `streetforge-concrete-wall` als 4m-Fassadentextur.
  - `streetforge-hud-plate` als Missionspaneel.
  - `streetforge-logo` als HUD- und Startzeichen.
- **Verify:**
  - WASD bewegt den Player; `Leertaste` greift an, `Q` löst den Sprintstoß aus, `1` aktiviert den schweren Schlag.
  - Gegner erkennen die Nähe, verfolgen den Player und greifen an; der Lebensbalken spiegelt Schaden sichtbar.
  - Getötete Gegner erzeugen Shards; die Aufnahme erhöht die Loot-Anzeige und XP.
  - Nach drei Kills wechselt das Missionsziel sichtbar auf „Block gesichert“.
  - HUD bleibt bei Desktop und schmalem Mobilformat lesbar; Buttons sind erreichbar und überlappen sich nicht.
  - Keine fehlenden Texturen, keine sichtbaren Platzhaltermaterialien, keine Browser-Konsolenfehler.
  - Der Screenshot zeigt Asphaltblau, Beton, Signalorange und Forge Lime sowie die Kamera-Perspektive des Referenzbilds.

