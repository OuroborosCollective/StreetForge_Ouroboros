# StreetForge City Systems Contract

StreetForge bildet die Stadt nicht als statische Kulisse ab. Jeder Stadtbereich erhält einen nachvollziehbaren Zustand, der auf dem Server gespeichert, zeitlich bewertet und durch autorisierte Spieleraktionen verändert wird. Sichtbare District-Infos, NPC-Verfügbarkeit, Housing-Freischaltungen, Story-Schritte, Tutorialfortschritt und Premiumentitlements lesen daher aus persistenten Datensätzen statt aus fest verdrahteten Erfolgsanzeigen.

| System | Persistenter Kernzustand | Spielerwirkung | Autorisierung |
|---|---|---|---|
| City Pulse | District-Takt, Druck, Versorgung, Alarmstufe | Verfügbare Kontakte, Begegnungen und Marktanreize | Serverprozess / Admin-Content |
| NPC-Routinen | Zeitfenster, District, Einsatzstatus und Beziehung | Kontakte reagieren nur an ihrem tatsächlichen Standort | Eigentum am Charakter und District-Eintritt |
| Storygraph | Knoten, Bedingungen, Entscheidungen und Abschlussstatus | Verzweigte Quests und freigeschaltete Folgepfade | Geschützte Storymutation |
| Housing | Besitzer, District, Ausbaugrad und Zugriff | Persönlicher Rückzugsort und spätere Dekoration | Eigentum am Account / Gangrecht |
| Tutorial | Schrittstatus und abgeschlossene Kernaktionen | Neue Charaktere erhalten nur den nächsten gültigen Schritt | Charakterbesitz und Serverfortschritt |
| Markt | Angebots-, Gebots- und Escrowzustand | Handel nur über den existierenden Auktionsservice | Besitzer- und Guthabenprüfung |
| Premium | Katalog, Preis, Entitlement und Providerstatus | Nur bezahlte und verifizierte Entitlements schalten Vorteile frei | Adminverwaltung; keine Freischaltung ohne Providerbeleg |

> Ein nicht konfigurierter Zahlungsadapter kann niemals Kauf, Zahlung oder Premiumfreischaltung auslösen. Er wird im Adminbereich ausschließlich als „nicht verbunden“ ausgewiesen.

## Modellierungsprinzipien

Die City-Clock wird nicht als Client-Uhr behandelt. Der Server schreibt einen District-Pulse mit UTC-Zeitpunkt und leitet daraus den aktuellen Abschnitt ab. NPCs besitzen Routinefenster; ein Kontakt ist nur verfügbar, wenn dessen Routine zum aktuellen Pulse passt. Story- und Tutorialfortschritt werden als atomare Zustandsübergänge angelegt, damit ein Reload keine unverdienten Belohnungen erzeugt.

Housing wird zunächst als Grundstücks- und Freischaltzustand modelliert. Es bleibt bewusst unabhängig von benutzerdefinierten GLB-Dateien: Eine hochgeladene Revierdatei ist erst nach S3-Upload, Besitzprüfung und Adminfreigabe verwendbar. Premiumprodukte referenzieren Entitlements statt UI-Schalter. Das verhindert eine Kaufdarstellung ohne verifizierte Transaktion.

## Territoriumskarte und Stadtintelligenz

Die Operationskonsole projiziert die Weltkarte aus dem geschützten Serverendpunkt `world.map`. Sie nimmt keine Risikowerte vom Client entgegen: `city_district_states` liefert Druck, Versorgung, Alarm und Phase; persistierte Gang-Claims liefern die Besitzerinformation. Aus diesen Belegen berechnet der Server für jede Zone die Kartenfarbe, Bedrohung, Patrouillenstärke, Reiseentscheidung und einen konkreten Einsatzhinweis.

| Kartenklasse | Farbe | Serverwirkung |
|---|---:|---|
| Neutral | Asphaltgrau | Beobachteter Stadtbereich mit moderatem Grundrisiko. |
| Gilde | Violett | Nur eine persistierte Gang-Claim-Aufzeichnung kann die Kontrolle über eine Basisklasse legen. |
| Feind | Signalrot | Hoher Bedrohungswert und sichtbarer Hinweis auf feindliche Kontrolle. |
| Raider | Signalorange | Erhöhter Raiderdruck; die Route bleibt nachvollziehbar als Vorsicht oder Hot Route markiert. |
| Sicher | Forge Lime | Versorgungs- und Erholungsroute mit reduzierter Bedrohung. |
| Polizei | Patrol Blue | Hoher Patrouillenwert; bei einem echten Server-Lockdown wird die Reise abgewiesen. |

> Die Karte ist keine zweite Spielsimulation. Sie ist eine serverautorisierte Projektion realer District-Pulse, Gang-Claims und Spielerpräsenz. Ein District-Wechsel schreibt weiterhin ausschließlich über `city_presence`.
