# Troubleshooting

## An older or smaller layout remains visible

Check all open dashboard tabs. A tab keeps the JavaScript class it loaded until it refreshes; toggling configuration does not reload the resource. Update the resource URL with a version query when manually updating, then refresh each tab. Confirm only one HomeCall resource is registered.

Judge geometry outside the editor: the preview and dashboard edit handles change available width. Hiding the picker cannot remove the need for recording footer clearance, so the size increase may be small.

## Missing card or custom element error

Confirm `homecall-card.js` is registered as a JavaScript **module**, the resource URL loads successfully, and the YAML type is `custom:homecall-card`. Install the separate HomeCall integration too. The card does not install backend routes itself.

## Microphone access fails

Use HTTPS, allow microphone access for this HA origin, check the OS input device, and verify another app has not blocked capture. Start with a current Chromium or Safari/WebKit browser. Browser permission errors appear in the card status.

## No speakers or send rejected

Check the integration's device allowlist and available Alexa speak entities. A custom default target cannot bypass that allowlist. An empty explicit target list leaves the action unavailable until speakers are selected.

## Alexa accepted but audio did not play

Read [integration troubleshooting](https://github.com/thomasgregg/homecall/blob/main/docs/troubleshooting.md). The card reports request acceptance and audio retrieval, not acoustic playback.

For an issue, provide HA/card version, browser/OS, card YAML with private entity names removed, card dimensions, whether the picker is visible, and reproduction steps. Avoid including recorded speech or receipt tokens.
