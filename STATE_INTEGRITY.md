# StreetForge State Integrity Contract

StreetForge akzeptiert keine sichtbare Funktion, die lediglich einen lokalen Erfolg vortäuscht. Jede Funktion mit Spielerwirkung muss an genau einen nachweisbaren Zustand gebunden sein: eine autorisierte Servermutation, einen persistierten Datenbankzustand, ein S3-Asset mit Eigentumsprüfung oder einen deterministischen Simulationszustand, der nur nach autorisiertem Spielbeitritt aktiv wird.

| Bereich | Zulässige Zustandsquelle | Aktueller Durchsetzungspunkt |
|---|---|---|
| Account und Charakter | Manus-OAuth und Datenbank | `characters.create`, `characters.enter`, Eigentumsprüfung im Character-Service |
| Progression und Waffen | Datenbank und geschützte Mutation | `world.weaponUse` und Profilservice |
| Gang, Revier und Markt | Datenbank und transaktionale Serverlogik | Gang-, Territory- und Auction-Services |
| District, Quest und NPC-Kontakt | Autorisierte Server-Sitzung und Katalogvertrag | `world.enterDistrict`, `world.acceptQuest`, `world.contactNpc` |
| Nutzerassets | S3 plus Rechte- und Moderationsstatus | Asset-Service und Adminreview |
| Canvas-Kampf | Deterministische Szene nach Charakterbeitritt | `GameHandle.start()` wird nur aus dem Charakterdialog ausgelöst |

## Verbotene Muster

> Kein URL-Parameter, keine lokale Testschleife und kein Client-Button darf eine aktive Spielsitzung, eine Belohnung, einen Besitzstand oder einen Kauf simulieren.

Der frühere lokale Startbypass ist entfernt. Browser-Smoke-Tests prüfen deshalb nur die reale Canvas-Verfügbarkeit und die Authentifizierungsbarriere. Vollständige Charakterauswahl und Spielbeitritt werden ausschließlich in einer gültigen OAuth-Sitzung ausgeführt.

## Ehrliche Verfügbarkeitsgrenze

Noch nicht an einen konfigurierten Zahlungsanbieter gebundene Premium-Angebote bleiben **nicht kaufbar**. Sie dürfen im Adminbereich lediglich als Katalog- und Freischaltregel definiert werden; ohne aktivierten Provider wird kein Checkout, keine Zahlung und keine Entitlement-Änderung ausgelöst.
