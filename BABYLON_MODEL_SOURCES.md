# Geprüfte Babylon-Modellquellen

StreetForge bevorzugt eigene prozedurale Meshes für dynamische Spielfiguren, Kampf und deterministische Kollisionskörper. Offizielle Babylon-Modelle dürfen als **nichtkritische, statische Szenenprops** ergänzt werden, wenn Herkunft, Lizenz und Ladebudget dokumentiert sind.

| Kandidat | Quelle | Lizenz | Größe | Freigabe für StreetForge |
|---|---|---|---:|---|
| ExplodingBarrel.glb | `https://models.babylonjs.com/ExplodingBarrel.glb` | CC BY 4.0 laut BabylonJS/MeshesLibrary | 2.89 MB | Ja, lazy-loaded als dekorative Street-Prop; keine Spiellogik/Kollision |
| BoomBox.glb | BabylonJS/MeshesLibrary | CC BY 4.0 laut Repository-Default | 10.7 MB | Nein, für das mobile Startbudget zu groß |
| CornellBox/cornellBox.glb | BabylonJS/Assets | CC BY 4.0, sofern nicht im Assetordner anders angegeben | 162 KB | Nicht passend zur StreetForge-Straßenszene |

Das offizielle BabylonJS/Assets-Repository steht unter CC BY 4.0, sofern ein Assetordner keine abweichende Lizenz trägt.[1] Das archivierte, offizielle MeshesLibrary-Repository weist ebenfalls CC BY 4.0 als Standard für nicht anders markierte Dateien aus und nennt den Modelle-CDN.[2] Die Babylon-Dokumentation führt `ExplodingBarrel.glb` als verfügbares Modell mit 2.9 MB auf.[3]

> Die Einbindung bleibt optional und fehlertolerant: Scheitert der CDN-Ladevorgang oder überschreitet der Client das mobile Budget, läuft StreetForge ausschließlich mit den vorhandenen prozeduralen Props weiter.

## Attribution

Die Laufzeit-Attribution lautet: **„ExplodingBarrel.glb — BabylonJS/MeshesLibrary, CC BY 4.0“**. Sie wird als Quellenhinweis im Repository und im Asset-Manifest mitgeführt.

## References

[1]: https://github.com/BabylonJS/Assets "BabylonJS Assets — CC BY 4.0"
[2]: https://github.com/BabylonJS/MeshesLibrary "BabylonJS MeshesLibrary — CDN und Standardlizenz"
[3]: https://doc.babylonjs.com/toolsAndResources/assetLibraries/availableMeshes/ "Babylon.js Documentation — verfügbare Meshes"
