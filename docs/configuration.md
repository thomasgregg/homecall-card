# Layout and configuration

## Native editor

Appearance controls whether the speaker picker is shown. Default recipients selects all allowed available devices or a custom list. Save the card and leave dashboard edit mode before judging its final size: edit handles and the preview can have different widths.

A missing `default_targets` selects all allowed available devices. An explicit empty array selects none. New recordings retain the current in-card selection; a configuration rebuild initializes it from the saved defaults again.

## Sections sizing

Use standard `grid_options`; the default is 12 columns by 5 rows, with a minimum suggested 6 columns by 3 rows. The card's own minimum height is 184px. Widths and heights vary with the section and viewport; grid dimensions do not guarantee a fixed pixel size.

```yaml
type: custom:homecall-card
grid_options:
  columns: 12
  rows: 5
```

## Layout rules

- The action diameter stays within 52–240px and scales with available width and height.
- With a picker, the action clears the selector's upper corner.
- With no picker and no caption, the action stays vertically centered.
- A caption appears only when the center footer slot has enough room. With no picker and a visible caption, the action may move upward to use available space.
- Compact icon-only cards keep footer controls inset by 8px plus the card border. Their timer omits the additional end inset used on larger cards.
- The full decorative halo reserves at least 8px clearance from delete and timer rectangles, even while those controls are hidden. This keeps size and position stable during recording.
- Small cards can show only a modest size increase when hiding the picker. Footer clearance remains a constraint.

## Recording states

| State     | Visible action                     | Behavior                                         |
| --------- | ---------------------------------- | ------------------------------------------------ |
| Ready     | Blue microphone                    | Starts capture                                   |
| Starting  | Blue; progress appears after 300ms | Requests input permission and device status      |
| Recording | Red send icon, waveform and dot    | Captures up to 60 seconds; tap to send           |
| Recorded  | Blue send icon                     | At the limit, audio waits for explicit send      |
| Sending   | Busy action                        | Uploads audio and awaits acceptance              |
| Sent      | Confirmation                       | Full acceptance returns to ready after 5 seconds |
| Error     | Retry                              | Detailed status explains the failure             |

Discard invalidates the current session, stops tracks, disconnects the audio processor, closes the audio context, clears buffers, and preserves recipient controls. Late microphone and HTTP callbacks cannot update a discarded recording.
