<p align="center"><img src="docs/assets/hero.svg" alt="HomeCall Card — your voice across your home" width="100%"></p>

<p align="center">
<a href="https://github.com/thomasgregg/homecall-card/actions/workflows/ci.yml"><img src="https://github.com/thomasgregg/homecall-card/actions/workflows/ci.yml/badge.svg" alt="Tests"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
<a href="https://hacs.xyz"><img src="https://img.shields.io/badge/HACS-custom_repository-41BDF5" alt="HACS custom repository"></a>
</p>

**A focused recording card for original-voice announcements to your Echo speakers.**

Tap to record. Choose the rooms. Tap to send. HomeCall Card gives Home Assistant a responsive microphone interface with a waveform, recording timer, recipient picker, and clear delivery feedback. It requires the separate [HomeCall integration](https://github.com/thomasgregg/homecall).

## Features

- **Record and send:** mono audio capture with a 60-second limit.
- **Responsive layout:** adapts to card dimensions; compact icon-only actions stay centered.
- **Optional speaker picker:** select rooms in the card or use configured defaults.
- **Stable recording controls:** discard and timer space is reserved across phases.
- **Native visual editor:** no YAML required for normal configuration.
- **Accessible feedback:** labeled controls, keyboard support, and detailed status.
- **English and German:** language follows Home Assistant.

## Install

First install and configure the [HomeCall integration](https://github.com/thomasgregg/homecall). Use Home Assistant 2026.9 or newer and open the dashboard through HTTPS.

### HACS

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
3. Speak; the red action, waveform, recording dot, and timer indicate capture.
4. Tap **Send**, or use **Discard** to start again.

Recording stops at 60 seconds and waits for you to send. After a fully accepted send, the card returns to ready after five seconds and preserves speaker selection. Partial failures stay visible for review. An audio-fetch receipt confirms retrieval, not audible playback.

## Configuration

| Option                   | Type         | Default                       | Meaning                                                                 |
| ------------------------ | ------------ | ----------------------------- | ----------------------------------------------------------------------- |
| `type`                   | string       | Required                      | `custom:homecall-card`                                                  |
| `show_speaker_selection` | boolean      | `true`                        | Show the recipient picker                                               |
| `default_targets`        | string array | All available allowed devices | Initial selection, using `notify.*_speak` entity IDs; `[]` selects none |
| `grid_options`           | object       | 12 columns × 5 rows           | Standard Home Assistant sections sizing                                 |

```yaml
type: custom:homecall-card
show_speaker_selection: false
default_targets:
  - notify.kitchen_speak
  - notify.living_room_speak
grid_options:
  columns: 6
  rows: 3
```

Defaults never bypass the integration's allowlist. Hiding the picker also hides the ability to change rooms in the card, so verify the default targets before hiding it.

The action size depends on width, height, recipient controls, and footer clearance. Hiding the picker can make it larger, but the increase may be subtle in a small card. Icon-only layouts retain equal top and bottom gaps. The minimum supported card height is 184px.

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

The browser suite tests the built card in Chromium and WebKit with stand-ins for native Home Assistant controls. It checks mounted configuration toggles, centering, border insets, halo clearance, and stable geometry across recording phases. These tests complement a real Home Assistant visual check; they do not emulate Alexa playback or validate every native frontend revision.

Licensed under [MIT](LICENSE). Built and maintained by [Thomas Gregg](https://github.com/thomasgregg).
