# StreetForge: deterministischer Kern und optionale P2P-Transportebene

## Entscheidung

StreetForge verwendet **keine Blockchain als Wahrheitsschicht für Spielzustand**. Stattdessen bleibt ein deterministischer, serverautoritärer Kern die einzige Instanz für Identität, Charaktere, Inventar, Auktionen, Fortschritt, Treffer, Drops und Revierbesitz. Eine optionale Peer-to-Peer-Ebene kann ausschließlich als beschleunigender Transport für nichtkritische, nachvollziehbar verwerfbare Daten eingesetzt werden.

> Ein Peer darf Informationen verbreiten, aber niemals Besitz, Schaden, XP, Loot, Währung oder einen Charakterbeitritt endgültig bestätigen.

| Ebene | Verantwortung | Autorität | P2P zulässig |
|---|---|---|---|
| **Identity & Account** | OAuth-Session, Account, Charakterauswahl | Server | Nein |
| **Deterministic World Core** | Tick, Inputsequenz, WorldSeed, Ereignisreihenfolge, Zustands-Hash | Server | Nein |
| **Economy Ledger** | Inventar, Auktion, Gebote, Escrow, Street Cred | Datenbank/Server | Nein |
| **Combat Resolution** | Treffer, Cooldown, Schadensbonus, Drops, XP | Server | Nein |
| **Presence Relay** | Positionsinterpolation, Emotes, Voice-Signalisierung | Server mit Rückfall | Eingeschränkt |
| **Content Distribution** | bereits freigegebene statische Modelle/Designartefakte | Signierte Asset-URLs | Optional, nur Cache-Hinweise |

## Deterministischer Funktionskern

Jeder World-Shard verarbeitet einen festen Tick. Clients senden nur signierte, rate-limitierte Eingabeabsichten mit einer monotonen Sequenznummer. Der Shard validiert Identität, Charakter, Cooldown, Reichweite und Besitz, führt die reine Simulationsfunktion aus und erzeugt einen kanonischen Event-Log-Eintrag mit Zustands-Hash. Persistenz erfolgt nur nach erfolgreicher Servervalidierung.

Die zu implementierende Kernsignatur bleibt bewusst klein:

```ts
nextState = simulate(previousState, acceptedInputs, worldSeed, tick)
stateHash = hash(canonicalize(nextState))
```

Für Reconnect und Fehlersuche speichert der Server Snapshot-Checkpoints plus Event-Log. Ein Client kann lokale Vorhersage verwenden, muss jedoch bei abweichendem Hash den Serverzustand übernehmen. Damit lässt sich Last horizontal über Shards verteilen, ohne Zustandswahrheit zu duplizieren.

## Optionale P2P-Schicht

`RTCDataChannel` ermöglicht bidirektionale Peer-to-Peer-Übertragung beliebiger Daten und verfügt über Puffer-/Reihenfolgeoptionen.[1] StreetForge würde diese Eigenschaft nur für kurzfristige Präsenzdaten nutzen, etwa lokale Positionsinterpolation, Ping-Messung oder sichtbare Emote-Hinweise. Der Server bleibt dabei Signalisierungsinstanz, Relay-Fallback und alleinige Autorität.

| Datenklasse | Transportpriorität | Verifikation | Verhalten bei Peer-Ausfall |
|---|---|---|---|
| Eingabeabsicht | Server | Sequenz, Charakter-Session, Tickfenster | Reconnect/Retry zum Server |
| Kampf/Economy/XP | Server | vollständige Simulation | Serverantwort abwarten |
| Positionsinterpolation | P2P bevorzugt, Server-Relay fallback | Zeitfenster, Distanzgrenze, Rate Limit | Letztes Sample ausblenden |
| Emotes/Voice-Signale | P2P bevorzugt | Payload-Limit, Sessionbindung | Server-Relay oder Verwerfen |
| Assets | CDN/S3 | Signatur, Hash, Freigabestatus | CDN erneut laden |

Eine „Bitcoin-ähnliche“ Verteilung ist für den autoritativen Spielzustand nicht vorgesehen: Konsens zwischen unbekannten Peers erhöht Latenz, ermöglicht keine verlässliche Besitzprüfung und widerspricht dem zeitkritischen Tickmodell. Für ausfallsensible Shards wird stattdessen eine deterministische Leader-/Replica-Replikation innerhalb einer kontrollierten Serverflotte genutzt. P2P bleibt eine **Transportoptimierung**, keine Konsensmaschine.

## Transportreihenfolge

1. Der Client authentifiziert sich und wählt einen Charakter.
2. Der Server weist eine kurzlebige Shard-Session mit Inputsequenz und Tickfenster aus.
3. Der Client sendet autoritative Aktionen an den Shard.
4. Der Shard validiert und publiziert kanonische Ereignisse samt Hash.
5. Optional eröffnet der Server eine signalisierte P2P-Nachbarschaft für Präsenzdaten.
6. Bei Überlastung, NAT-Problemen, Paketverlust oder Hashabweichung wird direkt auf Server-Relay zurückgefallen.

WebTransport ist als spätere **Client-zu-Server**-Ergänzung zu evaluieren: Die API unterstützt über HTTP/3 zuverlässige und unzuverlässige Übertragung in beide Richtungen, setzt aber einen sicheren Kontext voraus.[2] Er ersetzt in diesem Plan nicht die Autorität des Shards.

## Akzeptanzkriterien für eine spätere Implementierung

| Kriterium | Nachweis |
|---|---|
| Kein P2P-Paket verändert Besitz oder Fortschritt | Contract-Test und Server-Guard |
| Jede autoritative Aktion enthält Session, Sequenz und Tickfenster | Protokolltest |
| Hashdrift führt zu Server-Snapshot-Resync | Integrations-/Chaos-Test |
| Peer-Verbindung kann ohne Spielfehler ausfallen | E2E-Fallback-Test |
| Relay-Fallback wahrt Spielbeitritt und Handel | Shard-Health-Test |

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel "MDN: RTCDataChannel"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/WebTransport "MDN: WebTransport"
