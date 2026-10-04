import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const script = await readFile(
  new URL("../../homecall-card.js", import.meta.url),
  "utf8",
);
async function fixture(page, width = 215, height = 184) {
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
  await page.evaluate(() => {
    const c = document.createElement("homecall-card");
    c._load = function () {
      this._phase = "ready";
      this._selection = ["notify.kitchen_speak"];
      this._button("Aufnehmen");
    };
    c._hass = { locale: { language: "en" } };
    c._lang = "en";
    c.config = { show_speaker_selection: false };
    document.querySelector("main").append(c);
    document.querySelector("#toggle").onclick = () =>
      c.setConfig({
        show_speaker_selection: c.config.show_speaker_selection === false,
      });
  });
  await expect(page.locator("homecall-card .main")).toBeVisible();
}
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
test("saved configuration on/off cycle restores real mounted card size", async ({
  page,
}) => {
  await fixture(page);
  const off = await geometry(page);
  await page.locator("#toggle").click();
  await expect(page.locator("homecall-card .targets")).toBeVisible();
  const on = await geometry(page);
  await page.locator("#toggle").click();
  await expect(page.locator("homecall-card .targets")).toBeHidden();
  await expect.poll(async () => (await geometry(page)).size).toBe(off.size);
  expect(on.size).toBeLessThan(off.size);
});
for (const [width, height] of [
  [184, 184],
  [215, 184],
  [246, 184],
  [376, 312],
]) {
  test(`center and full halo clearance across phases at ${width}×${height}`, async ({
    page,
  }) => {
    await fixture(page, width, height);
    const idle = await geometry(page);
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
