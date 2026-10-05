# Troubleshooting

## An older or smaller layout remains visible

Check all open dashboard tabs. A tab keeps the JavaScript class it loaded until it refreshes; toggling configuration does not reload the resource. Update the resource URL with a version query when manually updating, then refresh each tab. Confirm only one HomeCall resource is registered.

Judge geometry outside the editor: the preview and dashboard edit handles change available width. Hiding the picker cannot remove the need for recording footer clearance, so the size increase may be small.

## Missing card or custom element error

Confirm `homecall-card.js` is registered as a JavaScript **module**, the resource URL loads successfully, and the YAML type is `custom:homecall-card`. Install the separate HomeCall integration too. The card does not install backend routes itself.

## Microphone access fails

Use HTTPS, allow microphone access for this HA origin, check the OS input device, and verify another app has not blocked capture. Start with a current Chromium or Safari/WebKit browser. Browser permission errors appear in the card status.

## No speakers or send rejected

Check the integration’s speaker selection and available allowed Alexa, DLNA, Sonos, Music Assistant, Google Cast or EchoMuse entities. DLNA requires a confirmed sound test. A custom default target cannot bypass that allowlist. An empty explicit target list leaves the action unavailable until speakers are selected.

## Request accepted but audio did not play

Read [integration troubleshooting](https://github.com/thomasgregg/homecall/blob/main/docs/troubleshooting.md). The card reports request acceptance and audio retrieval, not acoustic playback.

For an issue, provide HA/card version, browser/OS, card YAML with private entity names removed, card dimensions, whether the picker is visible, and reproduction steps. Avoid including recorded speech or receipt tokens.

## DLNA playback

Add the speaker in HomeCall settings through a successful sound test first. Check **Show in the card** and its HA availability. The integration chooses the delivery route for each configured entity. Connection and test failures are handled in the integration’s DLNA settings. Playback replaces current media. Optional Resume music after announcements is configured per speaker in the integration, not in the card.

## Other local speakers

Add Sonos, Music Assistant, Google Cast or EchoMuse players in the integration’s matching speaker section, select card visibility and save. Sound tests are optional. Check that the speaker, server or controller can reach Home Assistant’s local audio address. Select one route per physical speaker to avoid duplicate messages.

Google Cast replaces current playback without automatic restoration. EchoMuse uses ESPHome announcement support and delegates music handling to its controller; hardware playback remains unverified. See the integration’s [Google Cast guide](https://github.com/thomasgregg/homecall/blob/main/docs/google-cast.md) and [EchoMuse guide](https://github.com/thomasgregg/homecall/blob/main/docs/echomuse.md).
