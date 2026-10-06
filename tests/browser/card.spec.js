import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const script = await readFile(
  new URL("../../homecall-card.js", import.meta.url),
  "utf8",
);
async function fixture(
  page,
  width = 215,
  height = 184,
  liveStatus = false,
  recipient = "notify.kitchen_speak",
) {
  await page.setContent(
    `<style>body{--primary-color:#009ac0;--primary-text-color:#222;--secondary-text-color:#666;--ha-font-size-m:14px;--ha-border-radius-md:8px;--ha-border-radius-lg:12px;font-family:Arial}homecall-card{display:block;width:${width}px;height:${height}px}</style><button id="toggle">Toggle picker and save</button><main></main>`,
  );
  await page.evaluate(() => {
    customElements.define(
      "ha-card",
      class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: "open" }).innerHTML =
            "<style>:host{border:1px solid #ddd;border-radius:12px;background:white}</style><slot></slot>";
        }
      },
    );
    customElements.define(
      "ha-button",
      class extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: "open" }).innerHTML =
            '<style>:host{display:inline-flex}button{box-sizing:border-box;height:var(--ha-button-height,44px);border:1px solid transparent;border-radius:var(--ha-button-border-radius,8px);background:transparent;color:#666;font:14px Arial}:host(.main) button{background:var(--homecall-tone);color:white}</style><button part="base"><span part="label"><slot></slot></span></button>';
        }
      },
    );
    customElements.define(
      "ha-icon",
      class extends HTMLElement {
        connectedCallback() {
          this.style.cssText =
            "display:inline-block;width:var(--mdc-icon-size,20px);height:var(--mdc-icon-size,20px)";
        }
      },
    );
    customElements.define("ha-form", class extends HTMLElement {});
  });
  await page.addScriptTag({ content: script });
  await page.evaluate(
    ({ liveStatus, recipient }) => {
      const c = document.createElement("homecall-card");
      if (!liveStatus)
        c._load = function () {
          this._phase = "ready";
          this._selection = [recipient];
          this._button("Aufnehmen");
        };
      c._hass = { locale: { language: "en" } };
      if (liveStatus) {
        window.statusRequests = 0;
        window.echoOnline = false;
        c._hass.states = { [recipient]: { state: "unavailable" } };
        c._hass.fetchWithAuth = async () => {
          window.statusRequests++;
          return {
            ok: true,
            json: async () => ({
              default_targets: [],
              targets: [
                {
                  entity_id: recipient,
                  name: "Kitchen",
                  available: window.echoOnline,
                },
              ],
            }),
          };
        };
      }
      c._lang = "en";
      c.config = { show_speaker_selection: false };
      document.querySelector("main").append(c);
      document.querySelector("#toggle").onclick = () =>
        c.setConfig({
          show_speaker_selection: c.config.show_speaker_selection === false,
        });
    },
    { liveStatus, recipient },
  );
  await expect(page.locator("homecall-card .main")).toBeVisible();
}
test("an offline Echo recovers from HA updates without a dashboard reload", async ({
  page,
}) => {
  await fixture(page, 246, 184, true);
  await expect(page.locator("homecall-card .main")).toHaveAttribute(
    "aria-label",
    "Retry",
  );
  const original = await geometry(page);
  await page.locator("homecall-card").evaluate((c) => {
    c.hass = {
      ...c._hass,
      states: { ...c._hass.states, "sensor.other": { state: "on" } },
    };
  });
  expect(await page.evaluate(() => window.statusRequests)).toBe(1);
  await page.locator("homecall-card").evaluate((c) => {
    window.echoOnline = true;
    c.hass = {
      ...c._hass,
      states: {
        ...c._hass.states,
        "notify.kitchen_speak": { state: "unknown" },
      },
    };
  });
  await expect(page.locator("homecall-card .main")).toHaveAttribute(
    "aria-label",
    "Record",
  );
  expect(await page.evaluate(() => window.statusRequests)).toBe(2);
  expect((await geometry(page)).size).toBe(original.size);
});
test("Retry fetches current availability and keeps recovered recipients selected", async ({
  page,
}) => {
  await fixture(page, 246, 184, true);
  await expect(page.locator("homecall-card .main")).toHaveAttribute(
    "aria-label",
    "Retry",
  );
  await page.evaluate(() => {
    window.echoOnline = true;
  });
  await page.locator("homecall-card .main").click();
  await expect(page.locator("homecall-card .main")).toHaveAttribute(
    "aria-label",
    "Record",
  );
  expect(await page.evaluate(() => window.statusRequests)).toBe(2);
  expect(
    await page.locator("homecall-card").evaluate((c) => c._selection),
  ).toEqual(["notify.kitchen_speak"]);
  await page.locator("homecall-card").evaluate((c) => {
    c._phase = "recording";
    c.hass = {
      ...c._hass,
      states: { "notify.kitchen_speak": { state: "unavailable" } },
    };
  });
  expect(await page.locator("homecall-card").evaluate((c) => c._phase)).toBe(
    "recording",
  );
  expect(await page.evaluate(() => window.statusRequests)).toBe(2);
});
async function geometry(page) {
  return page.locator("homecall-card").evaluate((e) => {
    const q = (s) => e.shadowRoot.querySelector(s).getBoundingClientRect(),
      c = q("ha-card"),
      h = q(".halo"),
      b = q(".main"),
      cx = h.x + h.width / 2,
      cy = h.y + h.height / 2;
    const gap = (s) => {
      const r = q(s);
      return r.width
        ? Math.hypot(
            Math.max(r.left - cx, 0, cx - r.right),
            Math.max(r.top - cy, 0, cy - r.bottom),
          ) -
            h.width / 2
        : null;
    };
    const footer = q(".info");
    return {
      size: b.width,
      top: b.top - c.top,
      bottom: c.bottom - b.bottom,
      discardGap: gap(".discard"),
      timerGap: gap(".time"),
      leftInset: footer.left - c.left,
      rightInset: c.right - footer.right,
      bottomInset: c.bottom - footer.bottom,
      captionVisible: !e.shadowRoot.querySelector(".action-label").hidden,
      selectorHidden: e.shadowRoot.querySelector(".targets").hidden,
    };
  });
}
for (const width of [174, 177.5, 215, 231]) {
  test(`saved selector cycles restore mounted size at ${width}×184`, async ({
    page,
  }) => {
    await fixture(page, width, 184);
    const off = await geometry(page);
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.locator("#toggle").click();
      await expect(page.locator("homecall-card .targets")).toBeVisible();
      const on = await geometry(page);
      await page.locator("#toggle").click();
      await expect(page.locator("homecall-card .targets")).toBeHidden();
      await expect.poll(async () => (await geometry(page)).size).toBe(off.size);
      // On narrow cards the footer, rather than the picker, limits the circle.
      expect(on.size).toBeLessThanOrEqual(off.size);
      if (width >= 215) expect(on.size).toBeLessThan(off.size);
    }
    await page.locator("homecall-card").evaluate((c) => {
      c.hass = { ...c._hass, locale: { language: "de" } };
      c.hass = { ...c._hass, locale: { language: "en" } };
    });
    await expect.poll(async () => (await geometry(page)).size).toBe(off.size);
  });
}
for (const [width, height] of [
  [177.5, 184],
  [174, 184],
  [184, 184],
  [215, 184],
  [246, 184],
  [231, 184],
  [376, 312],
]) {
  test(`center and full halo clearance across phases at ${width}×${height}`, async ({
    page,
  }) => {
    await fixture(page, width, height);
    const idle = await geometry(page);
    if (width === 177.5) expect(idle.size).toBe(97);
    for (const phase of [
      "starting",
      "recording",
      "recorded",
      "sending",
      "sent",
      "error",
      "ready",
    ]) {
      await page.locator("homecall-card").evaluate((c, p) => {
        c._phase = p;
        c._view.classList.toggle("recording", p === "recording");
        c._view.querySelector(".time").textContent = "00:05";
        c._syncPhase();
        c._applyLayout();
      }, phase);
      const x = await geometry(page);
      expect(x.size).toBe(idle.size);
      expect(x.top).toBeCloseTo(idle.top, 1);
      expect(x.bottom).toBeCloseTo(idle.bottom, 1);
      if (!x.captionVisible) expect(x.top).toBeCloseTo(x.bottom, 1);
      expect(x.leftInset).toBeGreaterThanOrEqual(8);
      expect(x.rightInset).toBeGreaterThanOrEqual(8);
      expect(x.bottomInset).toBeGreaterThanOrEqual(8);
      if (x.discardGap !== null) expect(x.discardGap).toBeGreaterThanOrEqual(8);
      if (x.timerGap !== null) expect(x.timerGap).toBeGreaterThanOrEqual(8);
    }
  });
}

test("an offline DLNA speaker recovers when HA reports idle", async ({
  page,
}) => {
  await fixture(page, 246, 184, true, "media_player.jbl");
  await expect(page.locator("homecall-card .main")).toHaveAttribute(
    "aria-label",
    "Retry",
  );
  await page.locator("homecall-card").evaluate((c) => {
    window.echoOnline = true;
    c.hass = { ...c._hass, states: { "media_player.jbl": { state: "idle" } } };
  });
  await expect(page.locator("homecall-card .main")).toHaveAttribute(
    "aria-label",
    "Record",
  );
  expect(
    await page.locator("homecall-card").evaluate((c) => c._selection),
  ).toEqual(["media_player.jbl"]);
});

for (const width of [177.5, 246]) {
  test(`icon control boundaries match at ${width}px`, async ({ page }) => {
    await fixture(page, width, 184);
    await page.locator("#toggle").click();
    const sizes = await page.locator("homecall-card").evaluate((c) => {
      const measure = (selector) => {
        const el = c.shadowRoot.querySelector(selector);
        const base = el.shadowRoot?.querySelector("button") || el;
        const r = base.getBoundingClientRect();
        return {
          width: r.width,
          height: r.height,
          radius: getComputedStyle(base).borderRadius,
        };
      };
      const picker = measure("summary");
      c._phase = "recorded";
      c._syncPhase();
      const discard = measure(".discard");
      c._phase = "error";
      c._syncPhase();
      const status = measure(".status-more");
      return { picker, discard, status };
    });
    const expected = width < 200 ? 32 : 44;
    for (const control of Object.values(sizes)) {
      expect(control.width).toBe(expected);
      expect(control.height).toBe(expected);
      expect(control.radius).toBe(sizes.picker.radius);
    }
  });
}

test("moving a mounted dashboard card does not fetch or rebuild it twice", async ({
  page,
}) => {
  await fixture(page, 177.5, 184, true);
  const original = await page.locator("homecall-card").evaluate((c) => {
    window.originalCardView = c.shadowRoot.querySelector("ha-card");
    const container = document.createElement("section");
    document.body.append(container);
    container.append(c);
    return window.statusRequests;
  });
  await expect
    .poll(() => page.evaluate(() => window.statusRequests))
    .toBe(original);
  expect(
    await page
      .locator("homecall-card")
      .evaluate(
        (c) =>
          c.shadowRoot.querySelector("ha-card") === window.originalCardView,
      ),
  ).toBe(true);
});

test("actual removal releases resources and unchanged action keeps its icon", async ({
  page,
}) => {
  await fixture(page);
  expect(
    await page.locator("homecall-card").evaluate((c) => {
      const icon = c.shadowRoot.querySelector(".main ha-icon");
      c._button("Geräte werden geladen …");
      c._button("Aufnehmen");
      return icon === c.shadowRoot.querySelector(".main ha-icon");
    }),
  ).toBe(true);
  await page.locator("homecall-card").evaluate((c) => {
    window.removedCard = c;
    window.releases = 0;
    c._release = () => window.releases++;
    c.remove();
  });
  await expect.poll(() => page.evaluate(() => window.releases)).toBe(1);
  expect(
    await page.evaluate(() =>
      window.removedCard.shadowRoot.querySelector("ha-card"),
    ),
  ).toBeNull();
});

test("fast loading preserves the microphone; slow loading shows progress without allowing recording", async ({
  page,
}) => {
  await fixture(page, 215, 184, true);
  await page.locator("homecall-card").evaluate((c) => {
    window.echoOnline = true;
    window.resolveStatus = null;
    const fetchStatus = c._hass.fetchWithAuth;
    c._hass.fetchWithAuth = () =>
      new Promise((resolve) => {
        window.resolveStatus = async () => resolve(await fetchStatus());
      });
    window.loadPromise = c._load();
    window.loadingIcon = c.shadowRoot.querySelector(".main ha-icon");
  });
  const button = page.locator("homecall-card .main");
  expect(await button.evaluate((b) => !!b.loading)).toBe(false);
  expect(await button.evaluate((b) => !!b.disabled)).toBe(false);
  await expect(button).toHaveAttribute("aria-busy", "true");
  await button.click();
  expect(await page.locator("homecall-card").evaluate((c) => c._phase)).toBe(
    "loading",
  );
  await page.evaluate(async () => {
    await window.resolveStatus();
    await window.loadPromise;
  });
  expect(await button.evaluate((b) => !!b.loading)).toBe(false);
  expect(
    await button.evaluate(
      (b) => b.querySelector("ha-icon") === window.loadingIcon,
    ),
  ).toBe(true);
  await expect(button).toHaveAttribute("aria-disabled", "false");
  await page.locator("homecall-card").evaluate((c) => {
    window.loadPromise = c._load();
  });
  await expect.poll(() => button.evaluate((b) => !!b.loading)).toBe(true);
  await page.evaluate(async () => {
    await window.resolveStatus();
    await window.loadPromise;
  });
  expect(await button.evaluate((b) => !!b.loading)).toBe(false);
});

test("countdown and ring reach the limit without sending, and expose Send on a tiny card", async ({
  page,
}) => {
  await fixture(page, 177.5, 184);
  await page.locator("homecall-card").evaluate((c) => {
    c._phase = "recording";
    c._sampleRate = 48000;
    c._samples = 48000 * 30;
    c._view.classList.add("recording");
    c._button("Senden", "microphone");
    c._draw();
    cancelAnimationFrame(c._raf);
  });
  await expect(page.locator("homecall-card .time")).toHaveText("0:30");
  const progress = await page
    .locator("homecall-card ha-card")
    .evaluate((el) =>
      parseFloat(el.style.getPropertyValue("--homecall-recording-progress")),
    );
  expect(progress).toBeGreaterThanOrEqual(180);
  expect(progress).toBeLessThan(186);
  await page.locator("homecall-card").evaluate((c) => {
    window.sendsAtLimit = 0;
    c._finish = () => window.sendsAtLimit++;
    c._stopAtLimit();
  });
  await expect(page.locator("homecall-card .time")).toHaveText("0:00");
  await expect(page.locator("homecall-card .main ha-icon")).toHaveAttribute(
    "icon",
    "mdi:send-outline",
  );
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-tone",
    "blue",
  );
  await expect(page.locator("homecall-card .discard")).toBeVisible();
  await expect(page.locator("homecall-card .status-more")).toBeHidden();
  expect(await page.evaluate(() => window.sendsAtLimit)).toBe(0);
  await page.locator("homecall-card .main").click();
  expect(await page.evaluate(() => window.sendsAtLimit)).toBe(1);
});

test("microphone startup keeps its native appearance and ignores repeat clicks", async ({
  page,
}) => {
  await fixture(page);
  await page.locator("homecall-card").evaluate((c) => {
    window.AudioContext = class {
      constructor() {
        this.audioWorklet = { addModule: () => new Promise(() => {}) };
      }
      resume() {
        return new Promise(() => {});
      }
    };
    window.AudioWorkletNode ||= class {};
    window.isSecureContext ||
      Object.defineProperty(window, "isSecureContext", { value: true });
    if (!navigator.mediaDevices)
      Object.defineProperty(navigator, "mediaDevices", {
        value: { getUserMedia() {} },
      });
    window.startIcon = c.shadowRoot.querySelector(".main ha-icon");
  });
  await page.locator("homecall-card .main").click({ force: true });
  await expect(page.locator("homecall-card .main")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(
    await page.locator("homecall-card .main").evaluate((b) => !!b.disabled),
  ).toBe(false);
  await page.locator("homecall-card .main").click({ force: true });
  expect(
    await page.locator("homecall-card ha-card").getAttribute("data-phase"),
  ).toBe("starting");
  expect(
    await page
      .locator("homecall-card .main")
      .evaluate((b) => b.querySelector("ha-icon") === window.startIcon),
  ).toBe(true);
});

async function controlledRecorder(
  page,
  preview = false,
  constructionFails = false,
) {
  await fixture(page, 376, 350);
  await page.locator("homecall-card").evaluate(
    (c, { preview, constructionFails }) => {
      c.config.preview_before_send = preview;
      window.isSecureContext ||
        Object.defineProperty(window, "isSecureContext", { value: true });
      window.AudioContext = class {
        constructor(options) {
          this.sampleRate = options?.sampleRate || 96000;
          this.state = "running";
          this.audioWorklet = { addModule: async () => {} };
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
        createMediaStreamSource() {
          return { connect() {}, disconnect() {} };
        }
      };
      window.AudioWorkletNode = class {
        constructor() {
          if (constructionFails)
            throw new Error("Recorder construction failed");
          this.port = window.recorderPort = {
            postMessage(message) {
              window.stopRequested = message.type === "stop";
            },
            close() {},
          };
        }
        connect() {}
        disconnect() {}
      };
      window.microphoneTrack = Object.assign(new EventTarget(), {
        stop() {
          window.trackStopped = true;
        },
      });
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => ({
            getTracks: () => [window.microphoneTrack],
          }),
        },
      });
      window.uploads = [];
      c._hass.fetchWithAuth = async (url, options) => {
        if (options?.method === "POST") {
          const wav = new DataView(await options.body.arrayBuffer());
          window.uploads.push({
            url,
            samples: wav.getUint32(40, true) / 2,
            sampleRate: wav.getUint32(24, true),
            first: wav.getInt16(44, true),
            last: wav.getInt16(wav.byteLength - 2, true),
          });
          return {
            ok: true,
            json: async () => ({
              results: [{ accepted: true }],
              receipt: "private-audio-token",
              diagnostics: {
                diagnostic_id: "diagnostic-only-id",
                audio_fetches: 0,
                timings_ms: { conversion: 12 },
              },
            }),
          };
        }
        if (url.includes("diagnostic_id="))
          return {
            ok: true,
            json: async () => ({
              diagnostics: {
                diagnostic_id: "diagnostic-only-id",
                audio_fetches: 1,
                timings_ms: { conversion: 12, clip_to_first_fetch: 30 },
              },
            }),
          };
        throw new Error("Recording must not fetch status before capturing");
      };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.copiedDiagnostics = text;
          },
        },
      });
    },
    { preview, constructionFails },
  );
  await page.locator("homecall-card .main").click();
  if (constructionFails) {
    await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
      "data-phase",
      "error",
    );
    return;
  }
  await expect
    .poll(() => page.evaluate(() => !!window.recorderPort))
    .toBe(true);
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "starting",
  );
  await page.evaluate(() => {
    window.recorderPort.onmessage({ data: { type: "ready" } });
    window.recorderPort.onmessage({
      data: {
        type: "chunk",
        sequence: 0,
        samples: new Float32Array(12000).fill(0.25),
      },
    });
  });
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "recording",
  );
}

test("recorder construction failure releases the microphone without unhandled rejections", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await controlledRecorder(page, false, true);
  expect(await page.evaluate(() => window.trackStopped)).toBe(true);
  expect(await page.evaluate(() => window.uploads.length)).toBe(0);
  expect(errors).toEqual([]);
});

test("capture readiness, final flush, frozen recipients and private diagnostics", async ({
  page,
}) => {
  await controlledRecorder(page);
  await page.locator("homecall-card").evaluate((c) => {
    c.config.show_diagnostics = true;
  });
  await page.locator("homecall-card").evaluate((c) => {
    c._selection = ["notify.changed_speak"];
  });
  await page.locator("homecall-card .main").click();
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "stopping",
  );
  expect(await page.evaluate(() => window.stopRequested)).toBe(true);
  expect(await page.evaluate(() => window.uploads.length)).toBe(0);
  await page.evaluate(() => {
    window.recorderPort.onmessage({
      data: {
        type: "chunk",
        sequence: 1,
        samples: new Float32Array(128).fill(0.5),
      },
    });
    window.recorderPort.onmessage({
      data: { type: "stopped", total: 12128, reason: "requested" },
    });
  });
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "sent",
  );
  const uploads = await page.evaluate(() => window.uploads);
  expect(uploads).toHaveLength(1);
  expect(uploads[0]).toMatchObject({
    samples: 12128,
    sampleRate: 48000,
    first: 8191,
    last: 16383,
  });
  expect(uploads[0].url).toContain("notify.kitchen_speak");
  expect(uploads[0].url).not.toContain("changed_speak");
  expect(await page.evaluate(() => window.trackStopped)).toBe(true);
  await page.locator("homecall-card .status-more").click();
  await page.locator("homecall-card .status-popover summary").click();
  await page.getByText("Copy diagnostics", { exact: true }).click();
  const copied = await page.evaluate(() => window.copiedDiagnostics);
  expect(JSON.parse(copied).server.timings_ms.clip_to_first_fetch).toBe(30);
  expect(copied).not.toContain("private-audio-token");
  expect(copied).not.toContain("http");
});

test("optional local review flushes capture and waits for a separate Send", async ({
  page,
}) => {
  await controlledRecorder(page, true);
  await page.locator("homecall-card .main").click();
  await page.evaluate(() => {
    window.recorderPort.onmessage({
      data: { type: "stopped", total: 12000, reason: "requested" },
    });
  });
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "recorded",
  );
  await expect(
    page.locator("homecall-card .status-popover audio"),
  ).toBeVisible();
  expect(await page.evaluate(() => window.uploads.length)).toBe(0);
  expect(await page.evaluate(() => window.trackStopped)).toBe(true);
  await expect(
    page.locator("homecall-card .status-popover details"),
  ).toHaveCount(0);
  await page.locator("homecall-card .preview-send").click();
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "sent",
  );
  expect(await page.evaluate(() => window.uploads.length)).toBe(1);
});

test("diagnostic copy starts the clipboard write before refresh and retains the clicked trace", async ({
  page,
}) => {
  await controlledRecorder(page);
  await page.locator("homecall-card").evaluate((c) => {
    c.config.show_diagnostics = true;
  });
  await page.locator("homecall-card .main").click();
  await page.evaluate(() =>
    window.recorderPort.onmessage({
      data: { type: "stopped", total: 12000, reason: "requested" },
    }),
  );
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "sent",
  );
  await page.locator("homecall-card").evaluate((c) => {
    c._hass.fetchWithAuth = () =>
      new Promise((resolve) => {
        window.finishDiagnosticFetch = resolve;
      });
    window.ClipboardItem = class {
      constructor(data) {
        this.data = data;
      }
      getType(type) {
        return this.data[type];
      }
    };
    navigator.clipboard.write = async (items) => {
      window.clipboardWriteStarted = true;
      window.copiedDiagnostics = await (
        await items[0].getType("text/plain")
      ).text();
    };
  });
  await page.locator("homecall-card .status-more").click();
  await page.locator("homecall-card .status-popover summary").click();
  await page.getByText("Copy diagnostics", { exact: true }).click();
  expect(await page.evaluate(() => window.clipboardWriteStarted)).toBe(true);
  expect(await page.evaluate(() => window.copiedDiagnostics)).toBeUndefined();
  await page.locator("homecall-card").evaluate((c) => {
    c._diagnostics = { server: { diagnostic_id: "new-recording" } };
    window.finishDiagnosticFetch({
      ok: true,
      json: async () => ({
        diagnostics: {
          diagnostic_id: "diagnostic-only-id",
          timings_ms: { clip_to_first_fetch: 42 },
        },
      }),
    });
  });
  await expect
    .poll(() => page.evaluate(() => window.copiedDiagnostics))
    .toBeTruthy();
  const copied = JSON.parse(
    await page.evaluate(() => window.copiedDiagnostics),
  );
  expect(copied.server.diagnostic_id).toBe("diagnostic-only-id");
  expect(copied.server.timings_ms.clip_to_first_fetch).toBe(42);
  expect(
    await page
      .locator("homecall-card")
      .evaluate((c) => c._diagnostics.server.diagnostic_id),
  ).toBe("new-recording");
});

test("missing flush acknowledgement fails without uploading partial audio", async ({
  page,
}) => {
  await page.clock.install();
  await controlledRecorder(page);
  await page.locator("homecall-card .main").click();
  await page.clock.fastForward(2000);
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "error",
  );
  expect(await page.evaluate(() => window.uploads.length)).toBe(0);
  expect(await page.evaluate(() => window.trackStopped)).toBe(true);
});

for (const interruptedBy of ["microphone", "context"]) {
  test(`unexpected ${interruptedBy} interruption stops recording without uploading`, async ({
    page,
  }) => {
    await controlledRecorder(page);
    await page.locator("homecall-card").evaluate((c, interruptedBy) => {
      if (interruptedBy === "microphone")
        window.microphoneTrack.dispatchEvent(new Event("ended"));
      else {
        c._context.state = "interrupted";
        c._context.onstatechange();
      }
    }, interruptedBy);
    await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
      "data-phase",
      "error",
    );
    expect(await page.evaluate(() => window.uploads.length)).toBe(0);
    expect(await page.evaluate(() => window.trackStopped)).toBe(true);
    expect(
      await page.locator("homecall-card").evaluate((c) => c._chunks.length),
    ).toBe(0);
    expect(
      await page
        .locator("homecall-card")
        .evaluate((c) => c._diagnostics.recorder_error),
    ).toBe(
      interruptedBy === "microphone"
        ? "microphone_ended"
        : "context_interrupted",
    );
  });
}

for (const width of [160, 177.5, 246, 376]) {
  test(`one-row controls stay centered and timer sits below speaker at ${width}px`, async ({
    page,
  }) => {
    await fixture(page, width, 56);
    await page.locator("#toggle").click();
    for (const phase of [
      "ready",
      "loading",
      "starting",
      "recording",
      "recorded",
      "sending",
      "sent",
      "error",
    ]) {
      await page.locator("homecall-card").evaluate((c, phase) => {
        c._phase = phase;
        c._view.classList.toggle("recording", phase === "recording");
        c._syncPhase();
        c._applyLayout();
      }, phase);
      const g = await page.locator("homecall-card").evaluate((c) => {
        const q = (s) => c.shadowRoot.querySelector(s).getBoundingClientRect();
        const card = q("ha-card"),
          main = q(".main"),
          picker = q("summary"),
          trash = q(".discard"),
          time = q(".time"),
          wave = q(".wave");
        const cy = (r) => r.top + r.height / 2;
        return {
          height: card.height,
          center: cy(card),
          main: cy(main),
          picker: cy(picker),
          trash: trash.height ? cy(trash) : null,
          time: time.height
            ? {
                top: time.top,
                bottom: time.bottom,
                cx: time.left + time.width / 2,
              }
            : null,
          pickerBottom: picker.bottom,
          pickerCenterX: picker.left + picker.width / 2,
          bottom: card.bottom,
          waveLeft: wave.left,
          waveRight: wave.right,
          pickerLeft: picker.left,
          trashRight: trash.right,
          mainWidth: main.width,
        };
      });
      expect(g.height).toBe(56);
      expect(g.main).toBeCloseTo(g.center, 1);
      expect(g.picker).toBeCloseTo(g.center, 1);
      if (g.trash !== null) expect(g.trash).toBeCloseTo(g.center, 1);
      if (g.time) {
        expect(g.time.top).toBeGreaterThan(g.picker - 1);
        expect(g.time.bottom).toBeLessThanOrEqual(g.bottom);
        expect(g.time.cx).toBeCloseTo(g.pickerCenterX, 1);
      }
      expect(g.waveRight).toBeLessThan(g.pickerLeft);
      if (g.trash !== null) expect(g.waveLeft).toBeGreaterThan(g.trashRight);
      expect(g.mainWidth).toBe(36);
    }
    await page.locator("homecall-card").evaluate((c) => {
      c._phase = "ready";
      c._syncPhase();
      c._view.querySelector(".list").textContent = "Kitchen";
    });
    await page.locator("homecall-card summary").click();
    await expect(page.locator("homecall-card .list")).toBeVisible();
    const list = await page.locator("homecall-card .list").boundingBox();
    expect(list.width).toBeGreaterThanOrEqual(240);
    await page.keyboard.press("Escape");
    await expect(page.locator("homecall-card .list")).toBeHidden();
  });
}

for (const selector of [true, false]) {
  test(`one-row countdown digits and recording dot align with selector ${selector}`, async ({
    page,
  }) => {
    await fixture(page, 246, 56);
    if (selector) await page.locator("#toggle").click();
    for (const phase of ["starting", "recording", "recorded"]) {
      const geometry = await page
        .locator("homecall-card")
        .evaluate((c, phase) => {
          c._phase = phase;
          c._view.classList.toggle("recording", phase === "recording");
          c._view.querySelector(".time").textContent = "0:43";
          c._syncPhase();
          const time = c._view.querySelector(".time");
          const range = document.createRange();
          range.selectNodeContents(time);
          const digits = range.getBoundingClientRect();
          const card = c._view.getBoundingClientRect();
          const timer = time.getBoundingClientRect();
          const speaker = c._view
            .querySelector("summary")
            .getBoundingClientRect();
          const dot = getComputedStyle(time, "::before");
          return {
            digitX: digits.x + digits.width / 2,
            digitY: digits.y + digits.height / 2,
            timerX: timer.x + timer.width / 2,
            timerY: timer.y + timer.height / 2,
            speakerX: speaker.x + speaker.width / 2,
            cardY: card.y + card.height / 2,
            dotPosition: dot.position,
            dotTop: parseFloat(dot.top),
            timerHeight: timer.height,
            waveformRight: c._view
              .querySelector(".wave")
              .getBoundingClientRect().right,
            timerLeft: timer.left,
          };
        }, phase);
      expect(geometry.digitX).toBeCloseTo(geometry.timerX, 1);
      if (selector) expect(geometry.digitX).toBeCloseTo(geometry.speakerX, 1);
      else expect(geometry.timerY).toBeCloseTo(geometry.cardY, 1);
      if (phase === "recording") {
        expect(
          geometry.timerLeft - geometry.waveformRight,
        ).toBeGreaterThanOrEqual(12);
        expect(geometry.dotPosition).toBe("absolute");
        expect(geometry.dotTop).toBeCloseTo(geometry.timerHeight / 2, 1);
      }
    }
  });
}

for (const language of ["en", "de"]) {
  test(`recording limit caption clears the footer controls in ${language}`, async ({
    page,
  }) => {
    await fixture(page, 470, 312);
    await page.locator("homecall-card").evaluate((c, language) => {
      c._lang = language;
      c._phase = "recording";
      c._started = performance.now() - 60000;
      c._stopAtLimit();
    }, language);
    await expect(page.locator("homecall-card .action-label")).toBeVisible();
    await expect(page.locator("homecall-card .status-more")).toBeHidden();
    const positions = await page.locator("homecall-card").evaluate((c) => {
      const rect = (selector) =>
        c.shadowRoot.querySelector(selector).getBoundingClientRect().toJSON();
      return {
        caption: rect(".action-label"),
        discard: rect(".discard"),
        time: rect(".time"),
      };
    });
    expect(positions.caption.left).toBeGreaterThan(positions.discard.right);
    expect(positions.caption.right).toBeLessThan(positions.time.left);
    await expect(page.locator("homecall-card .status")).toHaveText(
      language === "de"
        ? "Zeitlimit erreicht - bereit zum Senden."
        : "Limit reached - ready to send.",
    );
  });
}

test("normal recording keeps the status icon hidden through flush, upload, success and reset", async ({
  page,
}) => {
  await page.clock.install();
  await controlledRecorder(page);
  await page.locator("homecall-card").evaluate((c) => {
    const fetch = c._hass.fetchWithAuth;
    c._hass.fetchWithAuth = async (url, options) => {
      if (options?.method === "POST")
        await new Promise((resolve) => {
          window.finishUpload = resolve;
        });
      return fetch(url, options);
    };
  });
  await page.locator("homecall-card .main").click();
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "stopping",
  );
  await expect(page.locator("homecall-card .status-more")).toBeHidden();
  await page.evaluate(() =>
    window.recorderPort.onmessage({
      data: { type: "stopped", total: 12000, reason: "requested" },
    }),
  );
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "sending",
  );
  await expect(page.locator("homecall-card .status-more")).toBeHidden();
  await page.evaluate(() => window.finishUpload());
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "sent",
  );
  await expect(page.locator("homecall-card .status-more")).toBeHidden();
  await page.clock.fastForward(5000);
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "ready",
  );
  await expect(page.locator("homecall-card .status-more")).toBeHidden();
  await page.locator("homecall-card .main").click();
  await expect
    .poll(() => page.evaluate(() => !!window.recorderPort.onmessage))
    .toBe(true);
  await page.evaluate(() =>
    window.microphoneTrack.dispatchEvent(new Event("ended")),
  );
  await expect(page.locator("homecall-card ha-card")).toHaveAttribute(
    "data-phase",
    "error",
  );
  await page.locator("homecall-card .status-more").click();
  await expect(page.locator("homecall-card .status-popover")).toBeVisible();
  await expect(
    page.locator("homecall-card .status-popover details"),
  ).toHaveCount(0);
  await expect(page.locator("homecall-card .status-popover pre")).toHaveCount(
    0,
  );
});

test("the native editor enables diagnostics explicitly and removes the option when disabled", async ({
  page,
}) => {
  await fixture(page);
  const config = await page.evaluate(() => {
    const editor = document.createElement("homecall-card-editor");
    editor.setConfig({
      type: "custom:homecall-card",
      preview_before_send: true,
    });
    document.querySelector("main").append(editor);
    const form = editor.shadowRoot.querySelector("ha-form");
    const initial = form.data.show_diagnostics;
    const fields = form.schema.find((s) => s.name === "troubleshooting").schema;
    const emitted = [];
    editor.addEventListener("config-changed", (event) =>
      emitted.push(event.detail.config),
    );
    form.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { ...form.data, show_diagnostics: true } },
      }),
    );
    const savedEditor = document.createElement("homecall-card-editor");
    savedEditor.setConfig(emitted[0]);
    document.querySelector("main").append(savedEditor);
    savedEditor.addEventListener("config-changed", (event) =>
      emitted.push(event.detail.config),
    );
    const savedForm = savedEditor.shadowRoot.querySelector("ha-form");
    const enabled = savedForm.data.show_diagnostics;
    savedForm.dispatchEvent(
      new CustomEvent("value-changed", {
        detail: { value: { ...savedForm.data, show_diagnostics: false } },
      }),
    );
    return { initial, fields, enabled, emitted };
  });
  expect(config.initial).toBe(false);
  expect(config.fields).toEqual([
    { name: "show_diagnostics", selector: { boolean: {} } },
  ]);
  expect(config.enabled).toBe(true);
  expect(config.emitted[0]).toMatchObject({
    show_diagnostics: true,
    preview_before_send: true,
  });
  expect(config.emitted[1]).not.toHaveProperty("show_diagnostics");
  expect(config.emitted[1].preview_before_send).toBe(true);
});
