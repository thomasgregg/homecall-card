# Architecture and testing

## Source and distribution

`src/homecall-card.js` owns the custom element, native editor, recording lifecycle, and translations. `src/layout.js` contains deterministic geometry and recipient popover bounds. `scripts/build.mjs` bundles these into the self-contained `homecall-card.js` that HACS or manual installations load.

The checked-in bundle is generated; edit source, run `npm run build`, and commit source and bundle together. CI rebuilds and fails if they diverge.

## Audio lifecycle

The browser captures mono floating-point samples with an AudioWorklet, writes a PCM WAV payload locally, and sends it only when the user taps Send. The integration serves the recorder protocol v1 module at `/homecall-assets/homecall-recorder-worklet.js`; update the integration and card together. Readiness acknowledges the first input quantum, including silence. Ordered chunks retain those samples, and stop flushes the partial final buffer before acknowledging completion. The processor enforces 60 seconds by sample count. Discard and disconnect stop capture immediately and invalidate asynchronous work using session tokens.

Microphone startup does not wait for a fresh status request. The card freezes the loaded recipient selection; the upload endpoint validates current availability and authorization. Optional review uses a revocable local WAV URL. Diagnostics record browser durations separately from HA durations, so no timestamps are compared across machines. A separate diagnostic ID allows the originating HA user to retrieve stage timings without disclosing the audio bearer token.

Capture requests 48 kHz to match HA's accepted WAV format and keep a full minute below the upload size limit. Unexpected track termination or audio-context interruption releases capture and rejects the incomplete recording. The backend rechecks recipients after encoding and uses a lifecycle generation to prevent pending uploads or tests from sending or retaining new audio across unload/reload.

The backend owns encoding, allowed recipients, and delivery links for Alexa, DLNA, Sonos, Music Assistant, Google Cast and EchoMuse. The card uploads one recording with the selected entity IDs; it does not implement speaker protocols. The frontend never stores an Amazon credential or adds credentials to audio links.

## Test layers

1. Unit tests load the source in an isolated JavaScript VM and exercise session cancellation, delayed startup, automatic reset, and selection retention.
2. Geometry tests cover card sizes, measured footer widths, and 72 popover containment scenarios.
3. Playwright loads the distributed bundle in Chromium and WebKit with controlled stand-ins for Home Assistant elements. Tests exercise the real mounted custom element and its `setConfig` rebuild, plus full-halo gaps, card-edge insets, and fixed geometry across phases.
4. Hardware acceptance checks use an actual HA instance and devices on the affected playback routes. Native component styling and hardware playback cannot be proven by the stand-in browser fixture.

Browser test artifacts and traces are uploaded by CI on failure. The mock fixture never requests the microphone and never contacts Amazon.
