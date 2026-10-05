/*! HomeCall Card v1.1.3 | MIT License | github.com/thomasgregg/homecall-card */
(() => {
  // src/layout.js
  function homeCallLayout(width, height, hasSelector = true, selectorWidth = 100, footerWidths = null) {
    if (height < 120) {
      const padding2 = 6;
      const button2 = Math.max(
        24,
        Math.floor(Math.min(36, (height - 12) / 1.18, width - 112))
      );
      return {
        short: true,
        compact: true,
        tiny: true,
        padding: padding2,
        footerPadding: padding2,
        controlWidths: { discard: 32, time: 44 },
        edgeFooter: false,
        selectorTop: height / 2 - 16,
        showLabel: false,
        labelSpace: 0,
        button: button2,
        centerY: height / 2,
        visualHeight: height - 12,
        icon: Math.round(button2 * 0.56)
      };
    }
    const compact = width < 280 || height < 240, tiny = width < 200 || height < 200;
    const padding = tiny ? 8 : compact ? 12 : 20, selectorTop = tiny ? 6 : compact ? 8 : 10;
    const cornerX = Math.max(0, width / 2 - padding - selectorWidth);
    const cornerY = Math.max(0, height / 2 - selectorTop - 45);
    const cornerLimit = hasSelector ? 2 * Math.max(26, Math.hypot(cornerX, cornerY) - 2) : height - 2 * padding;
    const footer = footerWidths || {
      discard: compact ? 46 : 122,
      time: 67,
      borderX: 1,
      borderY: 1
    };
    const narrow = width < 200;
    const discardHeight = narrow ? 32 : 44;
    const timerHeight = narrow ? 24 : 32;
    const footerDistance = Math.min(
      ...[
        [footer.discard, discardHeight],
        [footer.time, timerHeight]
      ].map(
        ([w, bottom]) => Math.hypot(
          Math.max(0, width / 2 - padding - (footer.borderX ?? 1) - w),
          Math.max(0, height / 2 - padding - (footer.borderY ?? 1) - bottom)
        )
      )
    );
    const footerLimit = 2 * Math.max(26, footerDistance - 8) / 1.18;
    const labelSpace = 2 * Math.max(
      0,
      width / 2 - padding - (footer.borderX ?? 1) - Math.max(footer.discard, footer.time) - 8
    );
    const showLabel = width >= 200 && height >= 220 && labelSpace >= 60;
    const edgeFooter = !hasSelector && !showLabel && compact;
    const footerPadding = edgeFooter ? 8 : padding;
    const controlWidths = {
      discard: narrow ? 32 : footer.discard,
      time: footer.time - (edgeFooter ? 13 : 0)
    };
    const labelLimit = showLabel ? (height / 2 - padding - (footer.borderY ?? 1) - 32 - 8) / 0.59 : Infinity;
    let button = Math.floor(
      Math.max(
        52,
        Math.min(
          240,
          width * 0.56,
          cornerLimit,
          footerLimit,
          labelLimit,
          (height - 2 * padding) / 1.18
        )
      )
    );
    let centerY = height / 2;
    if (!hasSelector) {
      const borderY = footer.borderY ?? 1, clearance = showLabel ? 8.5 : 8;
      const maximum = Math.floor(
        Math.min(
          // Preserve the accepted 97px small-card action rather than inventing
          // another diameter when compact footer controls free extra space.
          narrow ? 97 : 240,
          width * 0.56,
          (height - 2 * padding - 2 * borderY) / 1.18
        )
      );
      for (let candidate = maximum; candidate >= 52; candidate--) {
        const radius = candidate * 0.59, minimumY = padding + borderY + radius;
        let maximumY = height - padding - borderY - radius;
        if (showLabel)
          maximumY = Math.min(
            maximumY,
            height - padding - borderY - 32 - clearance - radius
          );
        for (const [controlWidth, controlHeight] of [
          [controlWidths.discard, discardHeight],
          [controlWidths.time, timerHeight]
        ]) {
          const distanceX = Math.max(
            0,
            width / 2 - footerPadding - (footer.borderX ?? 1) - controlWidth
          );
          if (distanceX < radius + clearance)
            maximumY = Math.min(
              maximumY,
              height - footerPadding - borderY - controlHeight - Math.sqrt((radius + clearance) ** 2 - distanceX ** 2)
            );
        }
        if (minimumY <= maximumY && (showLabel || minimumY <= height / 2 && maximumY >= height / 2)) {
          button = candidate;
          centerY = showLabel ? Math.max(minimumY, Math.min(height / 2, maximumY)) : height / 2;
          break;
        }
      }
    }
    const visualHeight = Math.min(
      button * 1.44,
      height - 2 * padding,
      hasSelector ? Infinity : 2 * Math.min(
        centerY - padding - (footer.borderY ?? 1),
        height - padding - (footer.borderY ?? 1) - centerY
      )
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
      icon: Math.round(button * 0.56)
    };
  }
  function homeCallRecipientBounds(card, anchor, viewport, inset = 16, outside = false) {
    if (outside) {
      const width = Math.min(280, Math.max(240, card.width), viewport.width - 16);
      const below = viewport.height - anchor.bottom - 12;
      const above = anchor.top - 12;
      const maxHeight2 = Math.min(240, Math.max(below, above));
      if (maxHeight2 < 44) return null;
      return {
        left: Math.max(
          8,
          Math.min(anchor.right - width, viewport.width - width - 8)
        ),
        top: below >= above ? anchor.bottom + 4 : anchor.top - maxHeight2 - 4,
        width,
        maxHeight: maxHeight2
      };
    }
    const left = Math.max(card.left + inset, 8), right = Math.min(card.right - inset, viewport.width - 8);
    const top = Math.max(card.top + inset, 8), bottom = Math.min(card.bottom - inset, viewport.height - 8);
    const listTop = Math.max(top, anchor.bottom + 4), maxHeight = Math.min(240, bottom - listTop);
    if (right - left < 44 || maxHeight < 44) return null;
    return { left, top: listTop, width: right - left, maxHeight };
  }

  // src/homecall-card.js
  async function homeCallNativeForms() {
    if (customElements.get("ha-form")) return;
    if (!window.loadCardHelpers)
      throw new Error("Home Assistant form components are unavailable.");
    const helpers = await window.loadCardHelpers();
    const card = helpers.createCardElement({ type: "entities", entities: [] });
    await card.constructor.getConfigElement();
  }
  var HOMECALL_EN = {
    Verwerfen: "Discard",
    "Alle Lautsprecher": "All speakers",
    "1 Lautsprecher": "1 speaker",
    "{count} Lautsprecher": "{count} speakers",
    "Neue Durchsage": "New announcement",
    "Erneut versuchen": "Retry",
    "Tippe auf das Mikrofon": "Tap the microphone",
    "Tippe auf das Mikrofon und sprich.": "Tap the microphone and speak.",
    "Ger\xE4te werden geladen \u2026": "Loading devices \u2026",
    "Ger\xE4te konnten nicht geladen werden.": "Could not load devices.",
    "HomeCall \xF6ffnen": "Open HomeCall",
    "Deine Stimme zu Hause": "Your voice at home",
    Durchsage: "Announcement",
    "An alle Lautsprecher": "To all speakers",
    "An {count} Lautsprecher": "To {count} speakers",
    "An 1 Lautsprecher": "To 1 speaker",
    "Kein Lautsprecher ausgew\xE4hlt": "No speaker selected",
    "Alle ausw\xE4hlen": "Select all",
    Bereit: "Ready",
    Aufnehmen: "Record",
    Senden: "Send",
    Schlie\u00DFen: "Close",
    Mikrofonpegel: "Microphone level",
    "Aufnahme verwerfen": "Discard recording",
    "Mikrofon wird vorbereitet \u2026": "Preparing microphone \u2026",
    "Sprich jetzt": "Speak now",
    "Wird gesendet": "Sending",
    "Deine Nachricht wird vorbereitet \u2026": "Preparing your message \u2026",
    "HomeCall ist noch nicht bereit.": "HomeCall is not ready yet.",
    "HomeCall ist noch nicht eingerichtet.": "HomeCall is not configured yet.",
    "Das Mikrofon ben\xF6tigt HTTPS. Bitte eine sichere HA-Adresse verwenden.": "The microphone requires HTTPS. Open HA using a secure address.",
    "Bitte den Mikrofonzugriff f\xFCr Home Assistant erlauben.": "Please allow microphone access for Home Assistant.",
    "Mikrofon konnte nicht gestartet werden.": "Could not start the microphone.",
    "Kein Lautsprecher ist gerade erreichbar.": "No speaker is available right now.",
    "Die Aufnahme war zu kurz. Bitte erneut aufnehmen.": "The recording was too short. Please record again.",
    "Bitte mindestens einen Lautsprecher ausw\xE4hlen.": "Please select at least one speaker.",
    "Die Durchsage konnte nicht gesendet werden.": "Could not send the announcement.",
    "Die Lautsprecher haben die Durchsage nicht angenommen.": "The speakers did not accept the announcement.",
    "Die Durchsage ist fehlgeschlagen.": "The announcement failed.",
    "Deine Sprachnachricht wurde abgerufen.": "Your voice message was retrieved.",
    "An die Lautsprecher gesendet. Der Audioabruf ist noch nicht best\xE4tigt.": "Sent to the speakers. Audio retrieval has not been confirmed yet.",
    "An {count} Lautsprecher gesendet.": "Sent to {count} speakers.",
    "Einige Ger\xE4te konnten nicht erreicht werden.": "Some devices could not be reached.",
    "Eine Durchsage wird gerade gesendet.": "An announcement is already being sent.",
    "Bitte erreichbare Lautsprecher ausw\xE4hlen.": "Please select available speakers.",
    "Aufnahme ist zu gro\xDF.": "The recording is too large.",
    "Ung\xFCltige Aufnahme. Bitte 1 bis 60 Sekunden sprechen.": "Invalid recording. Please speak for 1 to 60 seconds.",
    "Audio konnte nicht umgewandelt werden.": "Could not convert the audio.",
    "Zu viele Durchsagen. Bitte kurz warten.": "Too many announcements. Please wait a moment.",
    "Zeitlimit erreicht - bereit zum Senden.": "Limit reached - ready to send."
  };
  var HomeCallCard = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._phase = "idle";
      this._levels = Array(64).fill(0);
    }
    setConfig(config) {
      if (JSON.stringify(config) === JSON.stringify(this.config)) return;
      this._close();
      this.config = config;
      this._render();
    }
    set hass(hass) {
      const lang = (hass.locale?.language || hass.language || navigator.language || "en").toLowerCase().split("-")[0];
      const changed = this._lang !== lang;
      this._hass = hass;
      this._lang = lang;
      if (changed) this._close();
      if (changed || !this._view) this._render();
      else if (this._phase === "error" && this._availabilityError && this._availabilitySnapshot !== this._availabilityState())
        this._retryAvailability();
    }
    _availabilityState() {
      return JSON.stringify(
        Object.entries(this._hass?.states || {}).filter(
          ([id]) => id.startsWith("notify.") && id.endsWith("_speak") || id.startsWith("media_player.")
        ).map(([id, state]) => [
          id,
          state.state !== "unavailable" && (!id.startsWith("media_player.") || state.state !== "unknown")
        ]).sort(([a], [b]) => a.localeCompare(b))
      );
    }
    _retryAvailability() {
      this._nextSelection = this._selection?.length ? [...this._selection] : null;
      this._load();
    }
    _t(text, values = {}) {
      let result = this._lang === "de" ? text : HOMECALL_EN[text] || text;
      for (const [k, v] of Object.entries(values))
        result = result.replaceAll("{" + k + "}", v);
      return result;
    }
    _button(text, kind = "microphone") {
      const b = this._view.querySelector(".main");
      b.disabled = false;
      b.setAttribute("aria-label", this._t(text));
      b.title = this._t(text);
      if (b.dataset.kind !== kind) {
        b.dataset.kind = kind;
        b.innerHTML = '<ha-icon icon="mdi:' + kind + '"></ha-icon>';
      }
      this._view.querySelector(".action-label").textContent = this._t(text);
      this._syncPhase();
    }
    static async getConfigElement() {
      await homeCallNativeForms();
      return document.createElement("homecall-card-editor");
    }
    static getStubConfig() {
      return {};
    }
    getCardSize() {
      return 1;
    }
    getGridOptions() {
      return { columns: 6, rows: 1, min_columns: 6, min_rows: 1 };
    }
    connectedCallback() {
      if (!this._view) this._render();
    }
    _render() {
      if (!this.config || !this._hass || !this.isConnected) return;
      this.shadowRoot.innerHTML = `<style>
:host{display:block;height:100%;min-width:0;font-family:var(--primary-font-family,Roboto,sans-serif);--homecall-button-size:112px;--homecall-icon-size:63px;--homecall-padding:20px;--homecall-selector-top:10px;--homecall-content-inset:13px;--homecall-control-size:44px;--homecall-control-radius:var(--ha-border-radius-md)}
ha-card{display:flex;position:relative;flex-direction:column;box-sizing:border-box;height:100%;min-height:56px;min-width:0;padding:var(--homecall-padding);color:var(--primary-text-color);--homecall-tone:var(--ha-color-fill-primary-loud-resting,var(--primary-color))}
ha-card[data-tone="red"]{--homecall-tone:var(--ha-color-fill-danger-loud-resting,var(--error-color))}[hidden]{display:none!important}.header{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;position:absolute;top:var(--homecall-selector-top);inset-inline:var(--homecall-padding);z-index:2;pointer-events:none}
.targets{margin:0 0 0 auto;max-width:100%;flex:none;pointer-events:auto;color:var(--secondary-text-color);font-size:var(--ha-font-size-m)}.targets summary{display:flex;align-items:center;justify-content:flex-end;gap:4px;cursor:pointer;list-style:none;min-height:44px;min-width:44px;max-width:100%;border-radius:var(--homecall-control-radius);padding-inline:6px;margin-inline-end:calc(var(--homecall-content-inset) - 6px);-webkit-tap-highlight-color:transparent}.targets summary span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.targets summary::-webkit-details-marker{display:none}.targets summary:focus-visible{outline:2px solid var(--ha-color-focus);outline-offset:2px}.targets summary ha-icon{--mdc-icon-size:18px;flex:none}.targets .speaker-icon{display:none}.targets[open] .chevron{transform:rotate(180deg)}.targets summary[aria-disabled="true"]{color:var(--disabled-text-color);cursor:default}
.list,.status-popover{position:fixed;inset:auto;margin:0;box-sizing:border-box;color:var(--primary-text-color);font:var(--ha-font-size-m)/var(--ha-line-height-normal) var(--primary-font-family,Roboto,sans-serif);padding:8px 12px;overflow:auto;overscroll-behavior:contain;background:var(--ha-card-background,var(--card-background-color));border:1px solid var(--divider-color);border-radius:var(--ha-border-radius-lg);box-shadow:var(--ha-box-shadow-l)}.list{overflow-x:hidden}.status-popover{padding:16px;overflow-wrap:anywhere}.list ha-checkbox.all{display:flex;min-height:44px;border-bottom:1px solid var(--divider-color);margin-bottom:4px;padding-bottom:4px}
.action{display:flex;position:absolute;inset:0;pointer-events:none;flex-direction:column;align-items:center;justify-content:center}.visual{transform:translateY(var(--homecall-action-offset,0px));position:relative;display:flex;align-items:center;justify-content:center;width:calc(100% - 2*var(--homecall-padding));height:var(--homecall-visual-height,calc(var(--homecall-button-size)*1.44));max-height:calc(100% - 2*var(--homecall-padding));flex:none;isolation:isolate}.halo{position:absolute;width:calc(var(--homecall-button-size)*1.18);height:calc(var(--homecall-button-size)*1.18);border-radius:50%;background:var(--homecall-tone);opacity:.18;pointer-events:none;z-index:-1}.wave{position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none;z-index:-2}.recording .wave,ha-card[data-phase="recorded"] .wave{opacity:.24}
.recording .halo{opacity:.18;background:conic-gradient(var(--homecall-tone) var(--homecall-recording-progress,0deg),transparent 0);mask:radial-gradient(circle,transparent 60%,black 61%)}ha-card[data-phase="recorded"] .action-label{white-space:normal;font-size:var(--ha-font-size-s,12px);line-height:16px}
.main{pointer-events:auto;--ha-button-height:var(--homecall-button-size);--ha-button-border-radius:50%;--ha-button-box-shadow:none;flex:none}.main::part(base){width:var(--homecall-button-size);padding:0}.main::part(label){display:flex;align-items:center;justify-content:center}.main::part(spinner){font-size:var(--homecall-icon-size)}.main ha-icon{--mdc-icon-size:var(--homecall-icon-size)}.main[data-kind="send-outline"] ha-icon{--mdc-icon-size:calc(var(--homecall-icon-size)*.75)}.action-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:var(--ha-font-size-m);font-weight:var(--ha-font-weight-medium);line-height:20px;max-width:var(--homecall-label-space);text-align:center;color:var(--primary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:none}
ha-card[data-edge-footer="true"] .info{bottom:8px;inset-inline:8px}ha-card[data-edge-footer="true"] .time{padding-inline-end:0}
ha-card[data-narrow="true"] .info{height:32px;min-height:32px;align-items:flex-end}ha-card[data-narrow="true"] .discard{--ha-button-height:32px}ha-card[data-narrow="true"] .discard::part(base){min-width:32px;padding:0 5px}ha-card[data-narrow="true"] .time{font-size:12px;line-height:24px;gap:6px}
.info{display:flex;position:absolute;bottom:var(--homecall-padding);inset-inline:var(--homecall-padding);pointer-events:none;align-items:center;justify-content:space-between;gap:8px;height:44px;min-height:44px;flex:none;color:var(--secondary-text-color);font-size:var(--ha-font-size-m);line-height:20px}.discard{pointer-events:auto;--ha-button-height:44px;--ha-button-border-radius:var(--homecall-control-radius);--ha-button-box-shadow:none;flex:none}.discard::part(base){padding:0 12px;min-width:44px}.discard::part(label){display:flex;align-items:center;gap:8px;font-size:var(--ha-font-size-m);font-weight:400;line-height:20px}.discard ha-icon{--mdc-icon-size:20px}.message-control{display:flex;align-items:center;justify-content:center;min-width:0;gap:4px}.status{line-height:20px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}.status-more{pointer-events:auto;flex:none;color:var(--secondary-text-color)}ha-card[data-phase="error"] .status-more{color:var(--error-color)}ha-card[data-phase="sent"] .status-more{color:var(--success-color)}.time{display:flex;align-items:center;gap:8px;margin-inline-start:auto;padding-inline-end:var(--homecall-content-inset);white-space:nowrap;font-variant-numeric:tabular-nums}.recording .time:before{content:'';display:block;width:8px;height:8px;flex:none;border-radius:50%;background:var(--ha-color-fill-danger-loud-resting,var(--error-color))}
.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
ha-card[data-compact="true"] .targets summary{justify-content:center;margin-inline-end:calc(var(--homecall-content-inset) - 11px);padding-inline:0}ha-card[data-compact="true"] .targets summary span,ha-card[data-compact="true"] .targets .chevron{display:none}ha-card[data-compact="true"] .targets .speaker-icon{display:block;--mdc-icon-size:22px}ha-card[data-compact="true"] .discard .discard-label{display:none}ha-card[data-compact="true"] .message-control{gap:0}
ha-card[data-narrow="true"]{--homecall-control-size:32px}
ha-card[data-compact="true"] .targets summary{box-sizing:border-box;width:var(--homecall-control-size);height:var(--homecall-control-size);min-width:var(--homecall-control-size);min-height:var(--homecall-control-size)}
ha-card[data-compact="true"] .discard::part(base),.status-more::part(base){box-sizing:border-box;width:var(--homecall-control-size);min-width:var(--homecall-control-size);padding:0}
.status-more{--ha-button-height:var(--homecall-control-size);--ha-button-border-radius:var(--homecall-control-radius);--ha-button-box-shadow:none}.status-more ha-icon{--mdc-icon-size:20px}
/* In a one-row card, side icons share the action's vertical centerline. */
ha-card[data-short="true"]{--homecall-control-size:32px}
ha-card[data-short="true"] .header{top:calc(50% - 16px);min-height:32px;height:32px}
ha-card[data-short="true"] .targets summary{margin-inline-end:6px}
ha-card[data-short="true"] .visual{width:calc(100% - 100px)}
ha-card[data-short="true"] .wave{width:calc(100% - 12px);inset-inline-start:0;inset-inline-end:12px}
ha-card[data-short="true"] .info{inset:0 var(--homecall-padding);height:100%;min-height:0}
ha-card[data-short="true"] .discard,ha-card[data-short="true"] .message-control{position:absolute;inset-inline-start:6px;top:calc(50% - 16px);height:32px}
ha-card[data-short="true"] .discard{--ha-button-height:32px}
ha-card[data-short="true"] .time{position:absolute;inset-inline-end:0;top:calc(50% + 11px);width:44px;height:14px;justify-content:center;margin:0;padding:0;font-size:var(--ha-font-size-s,12px);line-height:14px;gap:4px}
ha-card[data-short="true"] .time:before{position:absolute;inset-inline-start:0;top:50%;transform:translateY(-50%);width:6px;height:6px}
ha-card[data-short="true"]:has(.header[hidden]) .time{top:calc(50% - 7px)}
@media(hover:hover){.targets summary:hover{background:var(--ha-color-fill-neutral-quiet-hover)}}
</style><ha-card><div class="header"><details class="targets"><summary><ha-icon class="speaker-icon" icon="mdi:volume-high"></ha-icon><span></span><ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon></summary></details></div><div class="list" popover="auto"></div><div class="status-popover" popover="auto"></div><div class="action"><div class="visual"><canvas class="wave" aria-label="${this._t("Mikrofonpegel")}"></canvas><div class="halo" aria-hidden="true"></div><ha-button class="main" appearance="accent" variant="brand"></ha-button></div></div><div class="info"><div class="action-label"></div><ha-button class="discard" appearance="plain" variant="neutral" hidden><ha-icon icon="mdi:delete-outline"></ha-icon><span class="discard-label">${this._t("Verwerfen")}</span></ha-button><div class="message-control"><ha-button class="status-more" appearance="plain" variant="neutral" hidden></ha-button><div class="status" role="status" aria-live="polite"></div></div><div class="time" hidden>1:00</div></div></ha-card>`;
      this._view = this.shadowRoot.querySelector("ha-card");
      const discard = this._view.querySelector(".discard");
      discard.setAttribute("aria-label", this._t("Aufnahme verwerfen"));
      discard.title = this._t("Aufnahme verwerfen");
      discard.onclick = () => this._reset();
      this._view.querySelector(".status-more").onclick = () => this._showStatus();
      this._layoutObserver = new ResizeObserver(() => {
        cancelAnimationFrame(this._layoutRaf);
        this._layoutRaf = requestAnimationFrame(() => this._applyLayout());
      });
      this._layoutObserver.observe(this);
      this._applyLayout();
      const recipients = this._view.querySelector(".targets"), list = this._view.querySelector(".list");
      recipients.hidden = this.config.show_speaker_selection === false;
      recipients.querySelector("summary").addEventListener("click", (event) => {
        if (["starting", "sending"].includes(this._phase)) event.preventDefault();
      });
      recipients.addEventListener("toggle", () => {
        if (!this._view) return;
        if (!recipients.open) {
          if (list.matches(":popover-open")) list.hidePopover();
          return;
        }
        if (!this._positionTargets()) {
          recipients.open = false;
          return;
        }
        if (!list.matches(":popover-open")) list.showPopover();
      });
      list.addEventListener("toggle", (event) => {
        if (event.newState === "closed") recipients.open = false;
      });
      this._view.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            if (recipients.open) recipients.open = false;
            else if (["starting", "recording", "recorded"].includes(this._phase))
              this._reset();
          }
        },
        true
      );
      this._view.querySelector(".main").onclick = () => this._phase === "ready" ? this._start() : ["recording", "recorded"].includes(this._phase) ? this._finish() : !["loading", "starting"].includes(this._phase) && this._reset();
      this._visibility = () => {
        if (document.hidden && ["starting", "recording"].includes(this._phase))
          this._reset();
        else if (!document.hidden && this._phase === "error" && this._availabilityError)
          this._retryAvailability();
      };
      document.addEventListener("visibilitychange", this._visibility);
      this._dismissTargets = (event) => {
        if (!event.composedPath().includes(list)) recipients.open = false;
      };
      window.addEventListener("resize", this._dismissTargets);
      window.addEventListener("scroll", this._dismissTargets, true);
      this._load();
    }
    _positionTargets() {
      if (!this._view) return false;
      const bounds = homeCallRecipientBounds(
        this._view.getBoundingClientRect(),
        this._view.querySelector("summary").getBoundingClientRect(),
        { width: window.innerWidth, height: window.innerHeight },
        Math.min(16, this._layout?.padding || 16),
        !!this._layout?.short
      );
      if (!bounds) return false;
      const list = this._view.querySelector(".list");
      for (const [key, value] of Object.entries(bounds))
        list.style[key] = value + "px";
      return true;
    }
    _applyLayout() {
      if (!this._view) return;
      const width = this.clientWidth, height = this.clientHeight;
      if (!width || !height) return;
      const initial = homeCallLayout(
        width,
        height,
        this.config.show_speaker_selection !== false
      );
      this._view.dataset.compact = String(initial.compact);
      this._view.dataset.short = String(!!initial.short);
      this._view.dataset.narrow = String(width < 200);
      const measure = this._view.querySelector("canvas").getContext("2d");
      measure.font = (width < 200 ? "12px " : "14px ") + getComputedStyle(this).fontFamily;
      const border = getComputedStyle(this._view);
      const footerWidths = {
        discard: initial.compact ? 46 : Math.ceil(measure.measureText(this._t("Verwerfen")).width) + 54,
        time: Math.ceil(measure.measureText("00:00").width) + (width < 200 ? 21 : 29),
        borderX: Math.max(
          parseFloat(border.borderLeftWidth) || 0,
          parseFloat(border.borderRightWidth) || 0
        ),
        borderY: parseFloat(border.borderBottomWidth) || 0
      };
      const summary = this._view.querySelector("summary");
      const selectorWidth = summary.getBoundingClientRect().width + parseFloat(getComputedStyle(summary).marginInlineEnd);
      const layout = homeCallLayout(
        width,
        height,
        this.config.show_speaker_selection !== false,
        selectorWidth,
        footerWidths
      );
      this._layout = layout;
      this._view.dataset.edgeFooter = String(layout.edgeFooter);
      this._view.style.setProperty("--homecall-padding", layout.padding + "px");
      this._view.style.setProperty(
        "--homecall-selector-top",
        layout.selectorTop + "px"
      );
      this._view.style.setProperty(
        "--homecall-button-size",
        layout.button + "px"
      );
      this._view.style.setProperty("--homecall-icon-size", layout.icon + "px");
      this._view.style.setProperty(
        "--homecall-action-offset",
        layout.centerY - height / 2 + "px"
      );
      this._view.style.setProperty(
        "--homecall-visual-height",
        layout.visualHeight + "px"
      );
      this._view.style.setProperty(
        "--homecall-label-space",
        layout.labelSpace + "px"
      );
      this._view.querySelector(".action-label").hidden = !layout.showLabel;
      this._view.querySelector(".header").hidden = this.config.show_speaker_selection === false;
      this._syncPhase();
      const recipients = this._view.querySelector(".targets");
      if (recipients.open && !this._positionTargets()) recipients.open = false;
    }
    _syncPhase() {
      if (!this._view) return;
      this._view.dataset.phase = this._phase;
      const capturing = this._phase === "recording";
      this._view.dataset.tone = capturing ? "red" : "blue";
      this._view.querySelector(".main").variant = capturing ? "danger" : "brand";
      const active = ["starting", "recording", "recorded"].includes(this._phase), recording = ["recording", "recorded"].includes(this._phase), starting = this._phase === "starting", busy = this._phase === "loading" && this._loadingIndicator || this._phase === "sending";
      this._view.querySelector(".discard").hidden = !active;
      this._view.querySelector(".time").hidden = !(recording || starting);
      this._view.querySelector(".main").loading = busy;
      this._view.querySelector(".main").setAttribute(
        "aria-busy",
        String(busy || starting || this._phase === "loading")
      );
      this._view.querySelector(".main").setAttribute(
        "aria-disabled",
        String(["loading", "starting"].includes(this._phase))
      );
      const summary = this._view.querySelector("summary");
      summary.setAttribute(
        "aria-disabled",
        String(["starting", "sending"].includes(this._phase))
      );
      summary.tabIndex = ["starting", "sending"].includes(this._phase) ? -1 : 0;
      const info = this._view.querySelector(".message-control"), status = this._view.querySelector(".status"), icon = this._view.querySelector(".status-more");
      info.classList.toggle("sr-only", this._phase === "recording" || starting);
      status.classList.toggle("sr-only", true);
      const noSelection = this._phase === "ready" && this._selection?.length === 0;
      icon.hidden = this._phase === "sent" || this._phase === "recorded" && !this._layout?.showLabel || this._phase === "loading" && !this._loadingIndicator || this._phase === "recording" || starting || this._phase === "ready" && !noSelection;
      icon.innerHTML = `<ha-icon icon="mdi:${this._phase === "sent" ? "check-circle-outline" : this._phase === "error" || noSelection ? "alert-circle-outline" : "clock-outline"}"></ha-icon>`;
    }
    _showStatus() {
      const popover = this._view.querySelector(".status-popover");
      if (popover.matches(":popover-open")) {
        popover.hidePopover();
        return;
      }
      const anchor = this._view.querySelector(".status-more").getBoundingClientRect(), width = Math.min(
        360,
        window.innerWidth - 32,
        Math.max(240, this.clientWidth)
      );
      popover.style.width = width + "px";
      popover.style.left = Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16)) + "px";
      popover.style.maxHeight = Math.max(80, Math.min(240, window.innerHeight - 32)) + "px";
      popover.textContent = this._view.querySelector(".status").textContent;
      popover.showPopover();
      const height = popover.getBoundingClientRect().height;
      popover.style.top = Math.max(
        16,
        anchor.top >= height + 24 ? anchor.top - height - 8 : Math.min(anchor.bottom + 8, window.innerHeight - height - 16)
      ) + "px";
    }
    async _load() {
      this._availabilityError = false;
      const session = Symbol();
      this._session = session;
      this._chunks = [];
      this._levels = Array(64).fill(0);
      this._phase = "loading";
      clearTimeout(this._loadingTimer);
      this._loadingIndicator = false;
      this._loadingTimer = setTimeout(() => {
        if (session !== this._session || this._phase !== "loading") return;
        this._loadingIndicator = true;
        this._syncPhase();
      }, 300);
      this._setStatus("Ger\xE4te werden geladen \u2026");
      this._button("Ger\xE4te werden geladen \u2026");
      const summary = this._view.querySelector("summary");
      summary.querySelector("span").textContent = this._t(
        "Ger\xE4te werden geladen \u2026"
      );
      summary.setAttribute("aria-label", this._t("Ger\xE4te werden geladen \u2026"));
      summary.title = this._t("Ger\xE4te werden geladen \u2026");
      this._view.querySelector(".list").textContent = this._t(
        "Ger\xE4te werden geladen \u2026"
      );
      try {
        await homeCallNativeForms();
        if (session !== this._session) return;
        const response = await this._hass.fetchWithAuth("/api/homecall/status");
        const data = await response.json();
        if (session !== this._session) return;
        if (!response.ok)
          throw new Error(data.error || "HomeCall ist noch nicht bereit.");
        this._defaults = this._nextSelection || (Array.isArray(this.config.default_targets) ? this.config.default_targets : data.default_targets || []);
        this._defaultsAll = !this._nextSelection && !Array.isArray(this.config.default_targets) && !this._defaults.length;
        this._nextSelection = null;
        this._fillTargets(data.targets);
        this._phase = "ready";
        this._setStatus("Tippe auf das Mikrofon");
        this._button("Aufnehmen");
        this._updateSelection();
      } catch (error) {
        if (session !== this._session) return;
        this._phase = "error";
        const message = error.message === "Kein Lautsprecher ist gerade erreichbar." ? error.message : "Ger\xE4te konnten nicht geladen werden.";
        this._availabilityError = error.message === "Kein Lautsprecher ist gerade erreichbar.";
        this._availabilitySnapshot = this._availabilityState();
        const summary2 = this._view.querySelector("summary");
        summary2.querySelector("span").textContent = this._t(
          "Kein Lautsprecher ausgew\xE4hlt"
        );
        summary2.setAttribute(
          "aria-label",
          this._t("Kein Lautsprecher ausgew\xE4hlt")
        );
        summary2.title = this._t("Kein Lautsprecher ausgew\xE4hlt");
        this._view.querySelector(".list").textContent = this._t(message);
        this._setStatus(message);
        this._doneButton();
      } finally {
        if (session === this._session) clearTimeout(this._loadingTimer);
      }
    }
    _reset() {
      if (!this._view) return;
      this._session = Symbol();
      clearTimeout(this._readyTimer);
      clearTimeout(this._receiptTimer);
      this._release();
      this._chunks = [];
      this._samples = 0;
      this._started = 0;
      this._levels = Array(64).fill(0);
      this._view.querySelector(".targets").open = false;
      const status = this._view.querySelector(".status-popover");
      if (status.matches(":popover-open")) status.hidePopover();
      this._view.classList.remove("recording");
      this._view.querySelector(".time").textContent = "1:00";
      if (this._availabilityError || !this._view.querySelector(".echo-form") || !this._targets?.some((t) => t.available)) {
        this._retryAvailability();
        return;
      }
      this._phase = "ready";
      this._button("Aufnehmen");
      this._setStatus(
        this._selection.length ? "Tippe auf das Mikrofon" : "Bitte mindestens einen Lautsprecher ausw\xE4hlen."
      );
      this._view.querySelector(".main").disabled = !this._selection.length;
      this._draw();
    }
    _queueStartingIndicator() {
      clearTimeout(this._startingTimer);
      this._startingIndicator = false;
      const session = this._session;
      this._startingTimer = setTimeout(() => {
        if (session !== this._session || !this._view || this._phase !== "starting")
          return;
        this._startingIndicator = true;
        const label = this._t("Mikrofon wird vorbereitet \u2026");
        const button = this._view.querySelector(".main");
        button.setAttribute("aria-label", label);
        button.title = label;
        this._view.querySelector(".action-label").textContent = label;
        this._syncPhase();
      }, 300);
    }
    async _start() {
      if (!this._view || this._phase !== "ready") return;
      const selected = [...this._selection];
      if (!selected.length) return;
      const session = this._session;
      this._phase = "starting";
      this._view.querySelector(".targets").open = false;
      this._queueStartingIndicator();
      this._setStatus("Mikrofon wird vorbereitet \u2026");
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
          throw new Error(
            "Das Mikrofon ben\xF6tigt HTTPS. Bitte eine sichere HA-Adresse verwenden."
          );
        const context = new (window.AudioContext || window.webkitAudioContext)();
        this._context = context;
        await context.resume();
        if (session !== this._session || !this._view) return;
        const [response, stream] = await Promise.all([
          this._hass.fetchWithAuth("/api/homecall/status"),
          navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          }).then((stream2) => {
            if (session !== this._session || !this._view || this._phase !== "starting") {
              stream2.getTracks().forEach((t) => t.stop());
            } else this._stream = stream2;
            return stream2;
          })
        ]);
        if (session !== this._session || !this._view || this._phase !== "starting") {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const data = await response.json();
        if (session !== this._session || !this._view || this._phase !== "starting")
          return;
        if (!response.ok)
          throw new Error(data.error || "HomeCall ist noch nicht bereit.");
        this._defaults = selected;
        this._defaultsAll = false;
        this._fillTargets(data.targets);
        if (!this._selection.length)
          throw new Error("Kein Lautsprecher ist gerade erreichbar.");
        const source = this._context.createMediaStreamSource(stream);
        this._source = source;
        this._processor = this._context.createScriptProcessor(4096, 1, 1);
        this._sampleRate = this._context.sampleRate;
        this._samples = 0;
        this._processor.onaudioprocess = (e) => {
          if (this._phase !== "recording") return;
          const input = e.inputBuffer.getChannelData(0);
          const remaining = this._sampleRate * 60 - this._samples;
          const chunk = new Float32Array(
            input.subarray(0, Math.max(0, remaining))
          );
          this._chunks.push(chunk);
          this._samples += chunk.length;
          let sum = 0;
          for (let i = 0; i < chunk.length; i++) sum += chunk[i] * chunk[i];
          this._levels.push(
            Math.min(1, Math.sqrt(sum / Math.max(1, chunk.length)) * 6)
          );
          this._levels.shift();
          if (this._samples >= this._sampleRate * 60) this._stopAtLimit();
        };
        source.connect(this._processor);
        this._processor.connect(this._context.destination);
        clearTimeout(this._startingTimer);
        this._startingIndicator = false;
        this._phase = "recording";
        this._started = performance.now();
        this._view.querySelector(".main").disabled = false;
        this._view.classList.add("recording");
        this._button("Senden", "microphone");
        this._setStatus("Sprich jetzt");
        this._draw();
        this._timer = setTimeout(() => this._stopAtLimit(), 6e4);
      } catch (error) {
        if (session !== this._session) return;
        this._release();
        if (this._view) {
          this._phase = "error";
          this._setStatus(
            error.name === "NotAllowedError" ? "Bitte den Mikrofonzugriff f\xFCr Home Assistant erlauben." : error.message || "Mikrofon konnte nicht gestartet werden."
          );
          this._doneButton();
        }
      }
    }
    _fillTargets(targets) {
      this._targets = targets;
      if (!targets.some((t) => t.available))
        throw new Error("Kein Lautsprecher ist gerade erreichbar.");
      this._selection = targets.filter(
        (t) => t.available && (this._defaultsAll || this._defaults.includes(t.entity_id))
      ).map((t) => t.entity_id);
      const list = this._view.querySelector(".list");
      list.innerHTML = '<ha-checkbox class="select-all all"></ha-checkbox><ha-form class="echo-form"></ha-form>';
      const all = list.querySelector(".select-all");
      all.textContent = this._t("Alle ausw\xE4hlen");
      const form = list.querySelector("ha-form");
      form.hass = this._hass;
      form.computeLabel = () => "";
      form.schema = [
        {
          name: "targets",
          selector: {
            select: {
              multiple: true,
              mode: "list",
              options: targets.map((t) => ({
                value: t.entity_id,
                label: t.name + (t.available ? "" : " \xB7 offline"),
                disabled: !t.available
              }))
            }
          }
        }
      ];
      form.data = { targets: this._selection };
      form.addEventListener("value-changed", (event) => {
        if (event.target !== form) return;
        this._selection = (event.detail.value.targets || []).filter(
          (id) => targets.some((t) => t.entity_id === id && t.available)
        );
        this._updateSelection();
      });
      all.addEventListener("change", () => {
        this._selection = all.checked ? targets.filter((t) => t.available).map((t) => t.entity_id) : [];
        form.data = { targets: this._selection };
        this._updateSelection();
      });
      this._updateSelection();
    }
    _updateSelection() {
      const available = this._targets.filter((t) => t.available), count = this._selection.length, all = this._view.querySelector(".select-all");
      all.checked = count === available.length;
      all.indeterminate = count > 0 && count < available.length;
      const text = count === 0 ? "Kein Lautsprecher ausgew\xE4hlt" : count === 1 ? "1 Lautsprecher" : count === available.length ? "Alle Lautsprecher" : "{count} Lautsprecher";
      const summary = this._view.querySelector("summary");
      summary.querySelector("span").textContent = this._t(text, { count });
      summary.setAttribute("aria-label", this._t(text, { count }));
      summary.title = this._t(text, { count });
      if (this._phase === "ready")
        this._setStatus(
          count ? "Tippe auf das Mikrofon" : "Bitte mindestens einen Lautsprecher ausw\xE4hlen."
        );
      if (["ready", "recording", "recorded"].includes(this._phase))
        this._view.querySelector(".main").disabled = count === 0;
      this._applyLayout();
    }
    _stopAtLimit() {
      if (this._phase !== "recording") return;
      this._phase = "recorded";
      this._release();
      this._view.classList.remove("recording");
      this._button("Senden", "send-outline");
      this._view.querySelector(".action-label").textContent = this._t(
        "Zeitlimit erreicht - bereit zum Senden."
      );
      this._setStatus("Zeitlimit erreicht - bereit zum Senden.");
      this._draw();
    }
    _draw() {
      if (!this._view) return;
      const canvas = this._view.querySelector("canvas");
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = getComputedStyle(this._view).getPropertyValue("--homecall-tone").trim() || "transparent";
      const step = width / 64;
      for (let i = 0; i < 64; i++) {
        const h = Math.max(2, this._levels[i] * (height - 4));
        ctx.beginPath();
        ctx.roundRect(i * step, (height - h) / 2, Math.max(2, step - 2.4), h, 2);
        ctx.fill();
      }
      if (["recording", "recorded"].includes(this._phase)) {
        const elapsed = this._phase === "recorded" ? 60 : Math.max(
          0,
          Math.min(60, (performance.now() - this._started) / 1e3)
        );
        const remaining = Math.ceil(60 - elapsed);
        this._view.style.setProperty(
          "--homecall-recording-progress",
          `${elapsed * 6}deg`
        );
        this._view.querySelector(".time").textContent = String(Math.floor(remaining / 60)) + ":" + String(remaining % 60).padStart(2, "0");
      }
      if (this._phase === "recording")
        this._raf = requestAnimationFrame(() => this._draw());
    }
    _setStatus(message) {
      if (this._view) {
        const text = this._t(message);
        this._view.querySelector(".status").textContent = text;
        const icon = this._view.querySelector(".status-more");
        icon.label = text;
        icon.setAttribute("aria-label", text);
        icon.title = text;
        this._syncPhase();
      }
    }
    _scheduleReady() {
      clearTimeout(this._readyTimer);
      const session = this._session;
      this._readyTimer = setTimeout(() => {
        if (session === this._session && this._view && this._phase === "sent")
          this._reset();
      }, 5e3);
    }
    _doneButton() {
      this._button(
        this._phase === "sent" ? "Neue Durchsage" : "Erneut versuchen",
        this._phase === "sent" ? "check" : "refresh"
      );
    }
    _release() {
      clearTimeout(this._startingTimer);
      this._startingIndicator = false;
      clearTimeout(this._timer);
      cancelAnimationFrame(this._raf);
      if (this._processor) {
        this._processor.onaudioprocess = null;
        this._processor.disconnect();
        this._processor = null;
      }
      this._source?.disconnect();
      this._source = null;
      this._stream?.getTracks().forEach((t) => t.stop());
      this._stream = null;
      this._context?.close().catch(() => {
      });
      this._context = null;
    }
    _wav() {
      const total = this._chunks.reduce((n, c) => n + c.length, 0);
      const buffer = new ArrayBuffer(44 + total * 2);
      const view = new DataView(buffer);
      const text = (offset, s) => {
        for (let i = 0; i < s.length; i++)
          view.setUint8(offset + i, s.charCodeAt(i));
      };
      text(0, "RIFF");
      view.setUint32(4, 36 + total * 2, true);
      text(8, "WAVE");
      text(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, this._sampleRate, true);
      view.setUint32(28, this._sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      text(36, "data");
      view.setUint32(40, total * 2, true);
      let pos = 44;
      for (const chunk of this._chunks)
        for (const s of chunk) {
          const v = Math.max(-1, Math.min(1, s));
          view.setInt16(pos, v < 0 ? v * 32768 : v * 32767, true);
          pos += 2;
        }
      return new Blob([buffer], { type: "audio/wav" });
    }
    async _finish() {
      if (!["recording", "recorded"].includes(this._phase)) return;
      const session = this._session;
      this._view.querySelector(".targets").open = false;
      this._phase = "sending";
      this._release();
      this._view.classList.remove("recording");
      const targets = [...this._selection];
      this._button("Wird gesendet", "volume-high");
      this._view.querySelector(".main").disabled = true;
      this._setStatus("Deine Nachricht wird vorbereitet \u2026");
      try {
        if (this._samples / this._sampleRate < 0.2)
          throw new Error("Die Aufnahme war zu kurz. Bitte erneut aufnehmen.");
        if (!targets.length)
          throw new Error("Bitte mindestens einen Lautsprecher ausw\xE4hlen.");
        const query = new URLSearchParams();
        targets.forEach((t) => query.append("target", t));
        const response = await this._hass.fetchWithAuth(
          "/api/homecall/send?" + query,
          {
            method: "POST",
            headers: { "Content-Type": "audio/wav" },
            body: this._wav()
          }
        );
        const data = await response.json();
        if (session !== this._session || !this._view) return;
        this._chunks = [];
        if (!response.ok)
          throw new Error(
            data.error || "Die Durchsage konnte nicht gesendet werden."
          );
        const sent = data.results.filter((r) => r.accepted).length;
        if (!sent)
          throw new Error(
            "Die Lautsprecher haben die Durchsage nicht angenommen."
          );
        this._phase = "sent";
        this._setStatus(
          this._t("An {count} Lautsprecher gesendet.", { count: sent }) + (sent < targets.length ? " " + this._t("Einige Ger\xE4te konnten nicht erreicht werden.") : "")
        );
        this._doneButton();
        this._checkReceipt(data.receipt, 0);
        if (sent === targets.length) this._scheduleReady();
      } catch (error) {
        if (session !== this._session) return;
        this._chunks = [];
        this._phase = "error";
        this._setStatus(error.message || "Die Durchsage ist fehlgeschlagen.");
        if (this._view) this._doneButton();
      }
    }
    async _checkReceipt(receipt, attempt) {
      const session = this._session;
      if (!this._view || this._phase !== "sent") return;
      try {
        const response = await this._hass.fetchWithAuth(
          "/api/homecall/status?receipt=" + encodeURIComponent(receipt)
        );
        const data = await response.json();
        if (session !== this._session) return;
        if (data.audio_fetches > 0) {
          this._setStatus("Deine Sprachnachricht wurde abgerufen.");
          return;
        }
      } catch {
      }
      if (session !== this._session) return;
      if (attempt < 8)
        this._receiptTimer = setTimeout(
          () => this._checkReceipt(receipt, attempt + 1),
          2e3
        );
      else
        this._setStatus(
          "An die Lautsprecher gesendet. Der Audioabruf ist noch nicht best\xE4tigt."
        );
    }
    _close() {
      clearTimeout(this._loadingTimer);
      clearTimeout(this._readyTimer);
      this._layoutObserver?.disconnect();
      cancelAnimationFrame(this._layoutRaf);
      this._session = null;
      this._phase = "idle";
      this._release();
      clearTimeout(this._receiptTimer);
      cancelAnimationFrame(this._raf);
      document.removeEventListener("visibilitychange", this._visibility);
      window.removeEventListener("resize", this._dismissTargets);
      window.removeEventListener("scroll", this._dismissTargets, true);
      this._chunks = [];
      const list = this._view?.querySelector(".list");
      if (list?.matches(":popover-open")) list.hidePopover();
      this._view?.remove();
      this._view = null;
    }
    disconnectedCallback() {
      queueMicrotask(() => {
        if (!this.isConnected) this._close();
      });
    }
  };
  if (!customElements.get("homecall-card"))
    customElements.define("homecall-card", HomeCallCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "homecall-card",
    name: "HomeCall",
    description: "Voice announcements to your speakers \xB7 Durchsagen auf deinen Lautsprechern"
  });
  var HomeCallCardEditor = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    setConfig(config) {
      if (JSON.stringify(config) === JSON.stringify(this._config)) return;
      this._config = { ...config };
      this._render();
    }
    set hass(hass) {
      this._hass = hass;
      const lang = (hass.locale?.language || hass.language || "en").split("-")[0];
      if (lang !== this._lang) {
        this._lang = lang;
        this._render();
      }
      const form = this.shadowRoot.querySelector("ha-form");
      if (form) form.hass = hass;
      if (!this._loading && !this._targets) this._load();
    }
    _emit(config) {
      this._config = config;
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config },
          bubbles: true,
          composed: true
        })
      );
    }
    async _load() {
      this._loading = true;
      try {
        await homeCallNativeForms();
        const r = await this._hass.fetchWithAuth("/api/homecall/status");
        if (!r.ok) throw Error();
        this._targets = (await r.json()).targets;
        this._error = false;
      } catch {
        this._error = true;
      } finally {
        this._loading = false;
        this._render();
      }
    }
    _render() {
      if (!this._config) return;
      const de = this._lang === "de", custom = Array.isArray(this._config.default_targets);
      if (!this.shadowRoot.querySelector("ha-form")) {
        this.shadowRoot.innerHTML = '<style>:host{display:block}ha-alert{display:block;margin-top:16px}</style><ha-form></ha-form><div class="message"></div>';
        this.shadowRoot.querySelector("ha-form").addEventListener("value-changed", (event) => {
          if (event.target !== this.shadowRoot.querySelector("ha-form")) return;
          const data = event.detail.value, config = { ...this._config };
          delete config.title;
          if (data.show_speaker_selection) delete config.show_speaker_selection;
          else config.show_speaker_selection = false;
          if (data.mode === "all") {
            if (Array.isArray(config.default_targets))
              this._lastSelection = config.default_targets;
            delete config.default_targets;
          } else {
            config.default_targets = Array.isArray(this._config.default_targets) ? data.targets || [] : this._lastSelection || this._targets?.map((t) => t.entity_id) || [];
            this._lastSelection = config.default_targets;
          }
          const modeChanged = Array.isArray(config.default_targets) !== Array.isArray(this._config.default_targets);
          this._emit(config);
          if (modeChanged) this._render();
        });
      }
      const form = this.shadowRoot.querySelector("ha-form");
      form.hass = this._hass;
      const recipientFields = [
        {
          name: "mode",
          selector: {
            select: {
              mode: "list",
              options: [
                {
                  value: "all",
                  label: de ? "Alle freigegebenen Ger\xE4te" : "All allowed devices"
                },
                {
                  value: "custom",
                  label: de ? "Eigene Auswahl" : "Custom selection"
                }
              ]
            }
          }
        }
      ];
      if (custom)
        recipientFields.push({
          name: "targets",
          disabled: !this._targets,
          selector: {
            select: {
              multiple: true,
              mode: "list",
              options: (this._targets || []).map((t) => ({
                value: t.entity_id,
                label: t.name + (t.available ? "" : " \xB7 offline")
              }))
            }
          }
        });
      form.schema = [
        {
          name: "appearance",
          type: "expandable",
          flatten: true,
          icon: "mdi:palette-outline",
          schema: [{ name: "show_speaker_selection", selector: { boolean: {} } }]
        },
        {
          name: "recipients",
          type: "expandable",
          flatten: true,
          icon: "mdi:speaker-multiple",
          schema: recipientFields
        }
      ];
      form.data = {
        show_speaker_selection: this._config.show_speaker_selection !== false,
        mode: custom ? "custom" : "all",
        targets: this._config.default_targets || []
      };
      const labels = {
        appearance: de ? "Darstellung" : "Appearance",
        recipients: de ? "Standard-Empf\xE4nger" : "Default recipients",
        show_speaker_selection: de ? "Lautsprecherauswahl anzeigen" : "Show speaker selection",
        mode: "",
        targets: ""
      };
      form.computeLabel = (s) => labels[s.name] || "";
      form.computeHelper = (s) => s.name === "mode" ? de ? "Diese Empf\xE4nger sind standardm\xE4\xDFig ausgew\xE4hlt." : "These recipients are selected by default." : "";
      const message = this.shadowRoot.querySelector(".message");
      message.replaceChildren();
      if (custom && !this._targets) {
        const alert = document.createElement("ha-alert");
        alert.setAttribute("alert-type", this._error ? "error" : "info");
        alert.textContent = this._error ? de ? "Ger\xE4te konnten nicht geladen werden." : "Could not load devices." : de ? "Ger\xE4te werden geladen \u2026" : "Loading devices \u2026";
        message.append(alert);
        if (this._error) {
          const retry = document.createElement("ha-button");
          retry.setAttribute("appearance", "plain");
          retry.textContent = de ? "Erneut versuchen" : "Retry";
          retry.onclick = () => this._load();
          message.append(retry);
        }
      }
    }
  };
  if (!customElements.get("homecall-card-editor"))
    customElements.define("homecall-card-editor", HomeCallCardEditor);
})();
