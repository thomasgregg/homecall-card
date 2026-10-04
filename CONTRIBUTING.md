# Contributing

Open an issue before a substantial behavior or architecture change. Include the concrete problem, expected result, and a minimal reproduction. Keep pull requests focused and add a regression test for a fixed bug.

## Setup and checks

Follow the development commands in [README](README.md). Node.js 22 or newer is required. Install both Playwright browsers before the browser suite.

Run `npm run check`. Do not edit the generated root bundle directly.

## Reviewing behavior

Describe what changes for the user and what you tested. For UI changes, include idle and recording screenshots at the smallest supported card size, a normal size, and with the picker on and off. Check hover areas, timer/dot, border insets, and equal icon-only top/bottom spacing together. A passing helper test does not replace a native Home Assistant visual check.

Never include real credentials, recordings, delivery URLs, or personal dashboard screenshots in fixtures. Service-boundary fakes must fail loudly when unsupported methods are used.

## Release checklist

1. Update the version in `package.json` (and lockfile) and add a changelog entry.
2. Run all checks locally and confirm CI passes.
3. Rebuild the bundle and check native HA rendering and the saved picker on/off cycle.
4. Tag `v<version>` and push the tag. The release workflow validates and publishes the distribution asset.
5. Install the published asset through HACS or the manual instructions to verify packaging.

MIT is the project's license. Contributions are provided under that license.
