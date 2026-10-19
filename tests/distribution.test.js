import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import vm from "node:vm";

test("single-file distribution registers both canonical custom elements", async () => {
  assert.deepEqual(
    (await readdir(".")).filter((name) => name.endsWith(".js")),
    ["homecall-card.js"],
  );
  const names = [];
  const source = await readFile("homecall-card.js", "utf8");
  vm.runInNewContext(source, {
    HTMLElement: class {},
    customElements: {
      get: () => undefined,
      define: (name) => names.push(name),
    },
    window: { customCards: [] },
  });
  assert.deepEqual(names, ["homecall-card", "homecall-card-editor"]);
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const hacs = JSON.parse(await readFile("hacs.json", "utf8"));
  assert.equal(hacs.filename, "homecall-card.js");
  assert.ok(source.includes(pkg.version));
});

test("all local documentation links resolve", async () => {
  for (const dir of [".", "docs"])
    for (const name of await readdir(dir)) {
      if (!name.endsWith(".md")) continue;
      const source = await readFile(`${dir}/${name}`, "utf8");
      for (const match of source.matchAll(
        /\]\(([^)]+)\)|(?:src|href)="([^"]+)"/g,
      )) {
        const target = match[1] || match[2];
        if (!target.includes(":") && !target.startsWith("#"))
          await access(`${dir}/${target.split("#")[0]}`);
      }
    }
});
