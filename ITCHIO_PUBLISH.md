# itch.io Client Entry

`client/public/itchio.html` is a small **HTML5 wrapper**, not a second game build. It loads the public StreetForge origin `https://streetforge-vxh8uqun.manus.space/` by default and allows the launch URL to be explicitly overridden with `?gameUrl=https://your-public-server.example/`. Only HTTPS targets are accepted. The wrapper grants the iframe browser permissions needed by the game: autoplay after a player gesture, fullscreen, and gamepad access.

## Publish procedure

1. Create an itch.io project of type **HTML** and select “This file will be played in the browser”.
2. Upload a ZIP whose root contains `itchio.html`; set it as the launch file. Do not put it inside a nested folder.
3. Enable **Fullscreen button** and set the viewport to responsive/auto. StreetForge itself uses `viewport-fit=cover` for safe areas.
4. Test the itch.io draft in an incognito browser. Confirm that the StreetForge start screen, character gate, WebGL canvas, and fullscreen button load from the public HTTPS origin.
5. For the future private-server release, publish the wrapper with the query `?gameUrl=https://your-public-server.example/` or replace the documented fallback URL before zipping. The target must be a publicly reachable HTTPS origin that allows framing by itch.io.

> Never include Manus, GitHub, database, payment-provider, OAuth, or private-server credentials in the ZIP. The wrapper contains no secret and does not accept non-HTTPS targets.
