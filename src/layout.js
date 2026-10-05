// Keep icon-only actions centered; captions may reclaim space above the footer.
export function homeCallLayout(
  width,
  height,
  hasSelector = true,
  selectorWidth = 100,
  footerWidths = null,
) {
  const compact = width < 280 || height < 240,
    tiny = width < 200 || height < 200;
  const padding = tiny ? 8 : compact ? 12 : 20,
    selectorTop = tiny ? 6 : compact ? 8 : 10;
  // The selector occupies the upper corner, rather than a full-width header row.
  const cornerX = Math.max(0, width / 2 - padding - selectorWidth);
  const cornerY = Math.max(0, height / 2 - selectorTop - 45);
  const cornerLimit = hasSelector
    ? 2 * Math.max(26, Math.hypot(cornerX, cornerY) - 2)
    : height - 2 * padding;
  // Reserve both footer controls in every phase, including their hover area.
  // Timer content matches the native Discard button’s 12px padding + 1px border.
  const footer = footerWidths || {
    discard: compact ? 46 : 122,
    time: 67,
    borderX: 1,
    borderY: 1,
  };
  const narrow = width < 200;
  const discardHeight = narrow ? 32 : 44;
  const timerHeight = narrow ? 24 : 32;
  const footerDistance = Math.min(
    ...[
      [footer.discard, discardHeight],
      [footer.time, timerHeight],
    ].map(([w, bottom]) =>
      Math.hypot(
        Math.max(0, width / 2 - padding - (footer.borderX ?? 1) - w),
        Math.max(0, height / 2 - padding - (footer.borderY ?? 1) - bottom),
      ),
    ),
  );
  const footerLimit = (2 * Math.max(26, footerDistance - 8)) / 1.18;
  const labelSpace =
    2 *
    Math.max(
      0,
      width / 2 -
        padding -
        (footer.borderX ?? 1) -
        Math.max(footer.discard, footer.time) -
        8,
    );
  const showLabel = width >= 200 && height >= 220 && labelSpace >= 60;
  const edgeFooter = !hasSelector && !showLabel && compact;
  const footerPadding = edgeFooter ? 8 : padding;
  const controlWidths = {
    discard: narrow ? 32 : footer.discard,
    time: footer.time - (edgeFooter ? 13 : 0),
  };
  const labelLimit = showLabel
    ? (height / 2 - padding - (footer.borderY ?? 1) - 32 - 8) / 0.59
    : Infinity;
  let button = Math.floor(
    Math.max(
      52,
      Math.min(
        240,
        width * 0.56,
        cornerLimit,
        footerLimit,
        labelLimit,
        (height - 2 * padding) / 1.18,
      ),
    ),
  );
  let centerY = height / 2;
  if (!hasSelector) {
    // Find the largest action which clears the top, caption and footer controls.
    // Reserve the same controls in every state so starting or discarding cannot jump.
    const borderY = footer.borderY ?? 1,
      clearance = showLabel ? 8.5 : 8; // Keep 8px after subpixel rounding.
    const maximum = Math.floor(
      Math.min(
        // Preserve the accepted 97px small-card action rather than inventing
        // another diameter when compact footer controls free extra space.
        narrow ? 97 : 240,
        width * 0.56,
        (height - 2 * padding - 2 * borderY) / 1.18,
      ),
    );
    for (let candidate = maximum; candidate >= 52; candidate--) {
      const radius = candidate * 0.59,
        minimumY = padding + borderY + radius;
      let maximumY = height - padding - borderY - radius;
      if (showLabel)
        maximumY = Math.min(
          maximumY,
          height - padding - borderY - 32 - clearance - radius,
        );
      for (const [controlWidth, controlHeight] of [
        [controlWidths.discard, discardHeight],
        [controlWidths.time, timerHeight],
      ]) {
        const distanceX = Math.max(
          0,
          width / 2 - footerPadding - (footer.borderX ?? 1) - controlWidth,
        );
        if (distanceX < radius + clearance)
          maximumY = Math.min(
            maximumY,
            height -
              footerPadding -
              borderY -
              controlHeight -
              Math.sqrt((radius + clearance) ** 2 - distanceX ** 2),
          );
      }
      if (
        minimumY <= maximumY &&
        (showLabel || (minimumY <= height / 2 && maximumY >= height / 2))
      ) {
        button = candidate;
        centerY = showLabel
          ? Math.max(minimumY, Math.min(height / 2, maximumY))
          : height / 2;
        break;
      }
    }
  }
  const visualHeight = Math.min(
    button * 1.44,
    height - 2 * padding,
    hasSelector
      ? Infinity
      : 2 *
          Math.min(
            centerY - padding - (footer.borderY ?? 1),
            height - padding - (footer.borderY ?? 1) - centerY,
          ),
  );
  return {
    compact,
    tiny,
    padding,
    footerPadding,
    controlWidths,
    edgeFooter,
    selectorTop,
    showLabel,
    labelSpace,
    button,
    centerY,
    visualHeight,
    icon: Math.round(button * 0.56),
  };
}
// The native popover stays within the visible part of its own card.
export function homeCallRecipientBounds(card, anchor, viewport, inset = 16) {
  const left = Math.max(card.left + inset, 8),
    right = Math.min(card.right - inset, viewport.width - 8);
  const top = Math.max(card.top + inset, 8),
    bottom = Math.min(card.bottom - inset, viewport.height - 8);
  const listTop = Math.max(top, anchor.bottom + 4),
    maxHeight = Math.min(240, bottom - listTop);
  if (right - left < 44 || maxHeight < 44) return null;
  return { left, top: listTop, width: right - left, maxHeight };
}
