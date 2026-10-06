# Layout and configuration

## Native editor

Appearance controls whether the speaker picker is shown and whether recordings are reviewed before sending. Default recipients selects all allowed available devices or a custom list. Save the card and leave dashboard edit mode before judging its final size: edit handles and the preview can have different widths.

**Review recording before sending** is optional and defaults to off (`preview_before_send: true` enables it in YAML). When enabled, the first tap after recording stops and flushes capture, then opens a local audio preview. Tap **Send** in the preview or dismiss it and tap the main Send button. Preview audio stays in the browser until you explicitly send it. Discard releases the preview too.

A missing `default_targets` selects all allowed available devices. An explicit empty array selects none. New recordings retain the current in-card selection; a configuration rebuild initializes it from the saved defaults again.

## Sections sizing

Use standard `grid_options`; the default and minimum suggested size is 6 columns by 1 row. The card's own minimum height is 56px. Widths and heights vary with the section and viewport; grid dimensions do not guarantee a fixed pixel size.

```yaml
type: custom:homecall-card
grid_options:
  columns: 6
  rows: 1
```

## Layout rules

- Cards below 120px high use a horizontal layout: the action, discard, and speaker icons share the vertical centerline, with the timer below the speaker. The action is up to 36px across; the waveform stays between the side controls. Speaker selection opens in a viewport-bounded popover outside the card. Existing native icons, controls, theme colors, fonts, and countdown behavior are reused.
- Taller cards keep the existing layout. Their action diameter stays within 52–240px and scales with available width and height.
- With a picker, the action clears the selector's upper corner.
- With no picker and no caption, the action stays vertically centered.
- A caption appears only when the center footer slot has enough room. With no picker and a visible caption, the action may move upward to use available space.
- Compact icon-only cards keep footer controls inset by 8px plus the card border. Their timer omits the additional end inset used on larger cards.
- The full decorative halo reserves at least 8px clearance from delete and timer rectangles, even while those controls are hidden. This keeps size and position stable during recording.
- Small cards can show only a modest size increase when hiding the picker. Footer clearance remains a constraint.

## Recording states

| State     | Visible action                            | Behavior                                                |
| --------- | ----------------------------------------- | ------------------------------------------------------- |
| Ready     | Blue microphone                           | Starts capture                                          |
| Starting  | Microphone; preparation label after 300ms | Loads the AudioWorklet and waits for input samples      |
| Recording | Red microphone, waveform and dot          | Captures up to 60 seconds; tap to send or review        |
| Stopping  | Busy action                               | Flushes final samples before releasing the microphone   |
| Recorded  | Blue send icon                            | At the limit or in review mode, waits for explicit send |
| Sending   | Busy action                               | Uploads audio and awaits acceptance                     |
| Sent      | Confirmation                              | Full acceptance returns to ready after 5 seconds        |
| Error     | Retry                                     | Detailed status explains the failure                    |

Discard invalidates the current session, stops tracks, disconnects the audio processor, closes the audio context, clears buffers, and preserves recipient controls. Late microphone and HTTP callbacks cannot update a discarded recording.

Recipients are frozen while recording and reviewing. The countdown uses captured samples. There is no fixed startup wait, stop delay, chime or silence added to normal recordings. First-sample and flush timeouts are failure deadlines, not minimum waits.
