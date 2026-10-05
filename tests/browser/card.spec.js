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
