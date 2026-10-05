# Changelog

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
