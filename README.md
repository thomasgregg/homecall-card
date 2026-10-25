# HomeCall Card has moved

![HomeCall Card — Your voice. Every room.](docs/assets/hero-compact.png)

HomeCall Card is included in the [HomeCall integration](https://github.com/thomasgregg/homecall) from **HomeCall 1.9.0**. Install and update only HomeCall; it supplies matching backend and dashboard card versions.

- [Current card guide, screenshots and configuration](https://github.com/thomasgregg/homecall#dashboard-card)
- [Install HomeCall](https://github.com/thomasgregg/homecall#install)
- [Migrate an existing standalone card](https://github.com/thomasgregg/homecall/blob/main/docs/card-migration.md)
- [Current source and development checks](https://github.com/thomasgregg/homecall/tree/main/card)
- [Report an issue](https://github.com/thomasgregg/homecall/issues)

Existing `type: custom:homecall-card` configurations stay valid. Update HomeCall, restart Home Assistant, remove the separate HACS card and obsolete resource URLs as described in the migration guide, then refresh your dashboard. YAML-managed resources require the guide's module entry.

## Historical releases and rollback

This repository is retained for history and rollback. Its standalone card releases and documentation describe the older two-install arrangement; they are not the installation instructions for current HomeCall.

If you roll back to a HomeCall integration release older than 1.9.0, use a compatible [historical standalone card release](https://github.com/thomasgregg/homecall-card/releases) and restore its saved module resource URL. The [v1.3.3 tagged source](https://github.com/thomasgregg/homecall-card/tree/v1.3.3) preserves the final standalone card's build and documentation.

New development lives in [thomasgregg/homecall](https://github.com/thomasgregg/homecall). See its [security policy](https://github.com/thomasgregg/homecall/security/policy) for current vulnerability reports. The historical source remains [MIT licensed](LICENSE).
