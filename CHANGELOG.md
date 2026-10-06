# Changelog

## 1.2.0

- Replace ScriptProcessor recording with HomeCall's AudioWorklet recorder. Show Speak now after the first microphone samples arrive; retain the opening samples and flush the final partial buffer before sending.
- Remove the status refresh from microphone startup, freeze the selected recipients for the recording, and enforce the 60-second limit by sample count.
- Add optional Review recording before sending, disabled by default, with local playback and a separate Send action.
- Add copyable capture, upload and HA timing diagnostics without recorded audio or audio bearer links. Keep diagnostic copying compatible with Safari's click-permission requirement.
- Request 48 kHz capture to match backend limits; reject incomplete recordings on microphone disconnect, audio-context interruption or missing flush acknowledgement. Preserve cancellation and stale-session guards.
- Require HomeCall integration 1.7.0 or newer. Update the integration first, restart HA, then update the card and refresh dashboard tabs. Normal messages receive no added padding or fixed wait; affected EchoMuse/MA setups still need hardware retesting.

## 1.1.6

- Update speaker compatibility guidance for Sonos, Music Assistant, Google Cast and direct EchoMuse announcements through HomeCall 1.6.0.
- Clarify that browser recording requires HTTPS while local speaker delivery and integration sound tests can use HTTP.
- Rebuild the versioned distribution bundle. Card runtime behavior is unchanged.

## 1.1.5

- Hide the redundant status clock at the recording limit so it cannot overlap the ready-to-send caption.
- Add English and German browser regression coverage for recording-limit footer clearance.
- Add README galleries captured from a real Home Assistant installation, including microphone waveforms, compact layouts, and speaker selection.

## 1.1.4

- Display the existing banner through a standard Markdown image and PNG export for HACS compatibility.
- Preserve the original banner artwork and application behavior.

## 1.1.3

- Fix the README banner in HACS by using an absolute public image URL.
- Documentation-only change; recording and integration behavior are unchanged.

## 1.1.2

- Show only the central checkmark after sending successfully, removing the duplicate status checkmark.
- Preserve the existing success styling, accessible status announcement, and automatic return to the microphone.

## 1.1.1

- Support a 6-column × 1-row card with a 56px minimum height.
- Center the action, discard, and speaker icons vertically in one-row cards.
- Center countdown digits beneath the speaker, or at middle height when the picker is hidden; keep the recording dot clear of the waveform.
- Open speaker selection outside short cards while keeping taller layouts unchanged.
- Reuse native icons, controls, fonts, colors, and countdown behavior.
- Document sizing in the README and add Chromium/WebKit layout regressions.

## 1.1.0

- Count down from 1:00 and fill the recording ring clockwise toward the 60-second limit.
- Stop recording at the limit without sending; show a smaller outlined Send icon and retain Discard.
- Show the limit message on larger cards and keep tiny-card footers clear.
- Preserve Home Assistant theme colours and the soft outer-ring opacity.
- Keep the microphone stable through quick initial loads and microphone startup; avoid transient disabled styling and startup spinners.

## 1.0.5

- Avoid rebuilding and fetching status twice when HA temporarily moves a mounted card.
- Keep unchanged action icons mounted during loading and status updates.
- Preserve resource cleanup on actual removal; add lifecycle browser regressions.

## 1.0.4

- Match speaker-picker, discard and status icon control boundaries and corner radii.
- Keep narrow controls at 32px and other compact controls at 44px without changing the main action size.
- Add browser checks for equal control width, height and radius.

## 1.0.3

- Restore the accepted 97px centered action on narrow dashboards with the speaker picker hidden.
- Keep timer and delete controls inside the card with at least 8px halo clearance.
- Verify exact sizing after picker toggles and frontend rerenders in Chromium and WebKit.

Version 1.0.2 was not released: packaging validation caught an outdated bundle version header.

- Use speaker-neutral labels for Alexa and DLNA recipients.
- Recover from unavailable DLNA speakers when HA reports them online.

## 1.0.1

- Recover automatically from stale speaker availability when an Echo comes back online or the dashboard becomes visible again.
- Refresh availability on Retry while preserving recipient selection and active recordings.
- Add browser regressions for offline recovery and the exact dashboard/editor dimensions.

## 1.0.0

Initial public release of HomeCall Card as an independent repository.

- Consistent HomeCall naming and separate installation/distribution.
- English and German UI.
- Automated behavior checks and documented development workflow.
- Responsive recording UI, recipient picker, stable footer geometry, and guarded recording sessions.
