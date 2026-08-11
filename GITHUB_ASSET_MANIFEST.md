# StreetForge Asset-Manifest für GitHub

Die binären Designartefakte bleiben bewusst im verwalteten Objektspeicher und werden im Projekt über stabile `/manus-storage/`-Pfade referenziert. Dadurch bleibt der Web-Build klein und die Repository-Synchronisation enthält keine großen oder vergänglichen Binärkopien. Dieses Manifest ist der vollständige Nachweis der aktuell verwendeten Designquellen.

| Artefakt | Typ | Projektpfad | Verwendung |
|---|---|---|---|
| Wet Asphalt | PNG-Textur | `/manus-storage/streetforge-wet-asphalt_c86a57b2.png` | Bodenmaterial und Regenoptik |
| Concrete Wall | PNG-Textur | `/manus-storage/streetforge-concrete-wall_a0b1aac0.png` | Distriktwände und urbane Kulisse |
| HUD Plate | PNG-UI-Textur | `/manus-storage/streetforge-hud-plate_04a996fa.png` | Missions- und HUD-Flächen |
| StreetForge Reference | PNG-Art Direction | `/manus-storage/streetforge-reference_9b97e7c6.png` | Startbild, Farb- und Szenenvorlage |
| StreetForge Logo | PNG-Brand Asset | `/manus-storage/streetforge-logo_862e9436.png` | HUD, Startscreen und Favicon |
| ExplodingBarrel | GLB-Szenenprop | `https://models.babylonjs.com/ExplodingBarrel.glb` | Optionaler, lazy-geladener Street-Prop auf Desktop-Budgets; BabylonJS/MeshesLibrary, CC BY 4.0 |

## Modellquellen

Der aktuelle Vertical Slice nutzt **prozedural erzeugte Babylon-Meshes** für Spielfigur, Gegner, District-Props, Wegmarken und Waffencaches. Die erzeugenden Quellen liegen unter `client/src/game/` und werden daher als Teil des Text-Projektsnapshots importiert. Es existiert aktuell kein fest eingechecktes GLB/GLTF-Binärmodell.

Benutzerdefinierte Charakter- und Reviermodelle werden nach Freischaltung als S3-Objekte gespeichert und erst nach Adminprüfung aktiv. Ihre Metadaten und Eigentumsprüfungen liegen in `custom_assets`; Binärdaten werden weder im Clientbundle noch im Repository dupliziert.

> Bei einem künftigen Freigabeprozess wird jedes neue GLB/GLTF-Modell zusätzlich mit Speicherpfad, SHA-256-Hash, Freigabestatus und Owner-ID in diesem Manifestformat dokumentiert.
