![HomeCall Card — your voice across your home](https://raw.githubusercontent.com/thomasgregg/homecall-card/main/docs/assets/hero-compact.png)

<p align="center">
<a href="https://github.com/thomasgregg/homecall-card/actions/workflows/ci.yml"><img src="https://github.com/thomasgregg/homecall-card/actions/workflows/ci.yml/badge.svg" alt="Tests"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
<a href="https://hacs.xyz"><img src="https://img.shields.io/badge/HACS-custom_repository-41BDF5" alt="HACS custom repository"></a>
</p>

**A focused recording card for original-voice announcements to your speakers.**

Tap to record. Choose the rooms. Tap to send. HomeCall Card gives Home Assistant a responsive microphone interface with a waveform, recording timer, recipient picker, and clear delivery feedback. It requires the separate [HomeCall integration](https://github.com/thomasgregg/homecall).

**HomeCall supports Alexa/Echo, compatible DLNA speakers, Sonos, Music Assistant players, Google Cast and EchoMuse Dots.** Configure speakers in the integration, then select them in the card. EchoMuse playback requires HomeCall 1.6.0 or newer and Dots connected through Home Assistant’s ESPHome integration; Music Assistant is not required. The card’s recording and speaker-picker behavior is shared across platforms. See the integration’s [speaker compatibility guide](https://github.com/thomasgregg/homecall#speaker-compatibility) and [EchoMuse setup](https://github.com/thomasgregg/homecall/blob/main/docs/echomuse.md) for setup, playback behavior and hardware verification.

## Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Install](#install)
- [Everyday use](#everyday-use)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Development](#development)

## Features

- **Record and send:** mono audio capture with a 60-second limit.
- **Responsive layout:** adapts to card dimensions; compact icon-only actions stay centered.
- **Optional speaker picker:** select rooms in the card or use configured defaults.
- **Stable recording controls:** discard and timer space is reserved across phases.
- **Native visual editor:** no YAML required for normal configuration.
- **Accessible feedback:** labeled controls, keyboard support, and detailed status.
- **English and German:** language follows Home Assistant.

## Screenshots

Captured from a real Home Assistant installation. The waveform comes from microphone audio; the larger layouts use the card editor’s preview.

![HomeCall Card ready, recording with a real waveform, and stopped at the recording limit](docs/assets/ui-states.png)

![HomeCall Card in a compact dashboard row and with the expanded speaker picker open](docs/assets/ui-layouts.png)

View the full-size captures: [ready](docs/assets/ui-expanded-ready.png), [recording](docs/assets/ui-expanded-recording.png), [ready to send](docs/assets/ui-expanded-limit.png), and [speaker selection](docs/assets/ui-speaker.png).

## Install

First install and configure the [HomeCall integration](https://github.com/thomasgregg/homecall). Use Home Assistant 2026.9 or newer and open the dashboard through HTTPS.

**HTTPS is required for microphone recording.** Browsers only allow microphone access from a secure page, so a dashboard opened at an ordinary HTTP address such as `http://192.168.1.10:8123` cannot record voice messages, even if you allow microphone permission. Open Home Assistant using a trusted HTTPS address, either on your local network or through an existing remote-access connection. You do not need to expose Home Assistant publicly. See the [browser microphone requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security).

This requirement applies to the dashboard used to record. Music Assistant and speaker audio delivery can still use local HTTP. You can also configure speakers and play the built-in test chime from the integration's HomeCall settings over HTTP.

### HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=thomasgregg&repository=homecall-card&category=plugin)

With HACS installed, click the button to open this custom repository in your Home Assistant instance. Add it when prompted, then choose **Download**. Install the integration and card separately.

1. Add `https://github.com/thomasgregg/homecall-card` to HACS **Custom repositories** as a **Dashboard** repository.
2. Download HomeCall Card.
3. Confirm HACS registered the JavaScript resource, refresh the dashboard, and add **HomeCall** from the card picker.

### Manual

Copy [`homecall-card.js`](homecall-card.js) to `<config>/www/homecall-card.js`. Register a JavaScript **module** resource at `/local/homecall-card.js` under **Settings → Dashboards → Resources**, then refresh the dashboard.

```yaml
type: custom:homecall-card
```

The root JavaScript file is a self-contained build. You do not need npm or a build step on Home Assistant.

## Everyday use

1. Choose speakers, if the picker is visible.
2. Tap the blue microphone and allow browser microphone access.
3. Speak; the red action and waveform indicate capture. The outer ring fills clockwise while the timer counts down from **1:00**.
4. Tap **Send**, or use **Discard** to start again.

At **0:00**, recording stops automatically and the button switches to a smaller outlined Send icon. It never sends automatically. Press **Send** or **Discard**; larger cards also show “Limit reached - ready to send.” After a fully accepted send, the card returns to ready after five seconds and preserves speaker selection. Partial failures stay visible for review. An audio-fetch receipt confirms retrieval, not audible playback.

## Configuration

| Option                   | Type         | Default                                  | Meaning                                                                                                                                                                    |
| ------------------------ | ------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                   | string       | Required                                 | `custom:homecall-card`                                                                                                                                                     |
| `show_speaker_selection` | boolean      | `true`                                   | Show the recipient picker                                                                                                                                                  |
| `default_targets`        | string array | All available speakers shown in the card | Initial selection, using allowed Alexa `notify.*_speak` or configured DLNA, Sonos, Music Assistant, Google Cast or EchoMuse `media_player.*` entity IDs; `[]` selects none |
| `grid_options`           | object       | 6 columns × 1 row                        | Standard Home Assistant sections sizing                                                                                                                                    |

```yaml
type: custom:homecall-card
show_speaker_selection: false
default_targets:
  - notify.kitchen_speak
  - notify.living_room_speak
grid_options:
  columns: 6
  rows: 1
```

Defaults never bypass the integration's allowlist. Hiding the picker also hides the ability to change rooms in the card, so verify the default targets before hiding it.

### Card sizing

In a **Sections** dashboard, HomeCall defaults to **6 columns × 1 row** (half a section wide). The minimum supported height is **56px**. Set the size in the card editor's **Layout** tab, or use `grid_options` as above. Existing cards keep their saved dimensions until you resize them.

At **1 row**, the microphone, discard icon, and speaker icon sit at the card's middle height. The countdown digits are centered below the speaker; when the speaker picker is hidden, the countdown and recording dot move to middle height. The waveform leaves space around the side controls. Speaker selection and longer status messages open in popovers outside the short card.

At **2 rows or more**, the card retains its taller layout, with the picker above and recording controls below. The main action scales to the available space; captions appear when there is enough room. These layouts use the same Home Assistant icons, fonts, controls, and theme colors.

Columns control width and rows control height. For example, use `columns: 12` and `rows: 3` for a larger card. Actual width depends on the dashboard and screen size. Masonry dashboards do not use `grid_options`; use a Sections view for the explicit 6 × 1 layout.

## Documentation

| Guide                                             | Covers                                                  |
| ------------------------------------------------- | ------------------------------------------------------- |
| [Layout and configuration](docs/configuration.md) | Sizing, picker behavior, recording states, and examples |
| [Troubleshooting](docs/troubleshooting.md)        | Cached builds, microphone errors, targets, and delivery |
| [Architecture and testing](docs/architecture.md)  | Source layout, builds, cancellation, and test scope     |
| [Contributing](CONTRIBUTING.md)                   | Setup, checks, and release process                      |
| [Privacy and security](SECURITY.md)               | Browser audio lifecycle and vulnerability reports       |
| [Changelog](CHANGELOG.md)                         | Public version history                                  |

## Development

```sh
npm ci
npm run build
npm test
npx playwright install chromium webkit
npm run test:browser
npm run format:check
```

The browser suite tests the built card in Chromium and WebKit with stand-ins for native Home Assistant controls. It checks mounted configuration toggles, centering, border insets, halo clearance, and stable geometry across recording phases. These tests complement a real Home Assistant visual check; they do not emulate speaker playback or validate every native frontend revision.

Licensed under [MIT](LICENSE). Built and maintained by [Thomas Gregg](https://github.com/thomasgregg).
