# Architecture and testing

## Source and distribution

`src/homecall-card.js` owns the custom element, native editor, recording lifecycle, and translations. `src/layout.js` contains deterministic geometry and recipient popover bounds. `scripts/build.mjs` bundles these into the self-contained `homecall-card.js` that HACS or manual installations load.

The checked-in bundle is generated; edit source, run `npm run build`, and commit source and bundle together. CI rebuilds and fails if they diverge.

## Audio lifecycle

The browser captures mono floating-point samples with the Web Audio API, writes a PCM WAV payload locally, and sends it only when the user taps Send. The current implementation uses `ScriptProcessorNode`, a deprecated but broadly available Web Audio API; AudioWorklet modernization is future work. Discard and disconnect stop capture and invalidate asynchronous work using session tokens.

The backend owns encoding, allowed recipients, and delivery links for Alexa, DLNA, Sonos, Music Assistant, Google Cast and EchoMuse. The card uploads one recording with the selected entity IDs; it does not implement speaker protocols. The frontend never stores an Amazon credential or adds credentials to audio links.

## Test layers

1. Unit tests load the source in an isolated JavaScript VM and exercise session cancellation, delayed startup, automatic reset, and selection retention.
2. Geometry tests cover card sizes, measured footer widths, and 72 popover containment scenarios.
3. Playwright loads the distributed bundle in Chromium and WebKit with controlled stand-ins for Home Assistant elements. Tests exercise the real mounted custom element and its `setConfig` rebuild, plus full-halo gaps, card-edge insets, and fixed geometry across phases.
4. Hardware acceptance checks use an actual HA instance and devices on the affected playback routes. Native component styling and hardware playback cannot be proven by the stand-in browser fixture.

Browser test artifacts and traces are uploaded by CI on failure. The mock fixture never requests the microphone and never contacts Amazon.
