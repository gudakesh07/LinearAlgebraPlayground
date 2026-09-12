import pkg from "/home/babayaga/.local/share/mise/installs/npm-playwright/1.63.0/node_modules/playwright/index.js";
const { chromium } = pkg;
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:4321";
const shotDir = "/tmp/lap-e2e";
mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
  ],
});

const errors = [];
function check(cond, msg) {
  if (!cond) {
    errors.push(msg);
    console.error("FAIL:", msg);
  } else {
    console.log("ok:", msg);
  }
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

await page.goto(BASE, { waitUntil: "networkidle" });
const heading = page.getByRole("heading", { name: "Linear Algebra Playground" });
await heading.waitFor();
const title = await heading.innerText();
check(title.includes("Linear Algebra Playground"), `title is '${title}'`);

check(await page.locator("canvas").count().then((n) => n >= 1), "2D canvas present");
check(await page.getByRole("tab", { name: "Add" }).count().then((n) => n === 1), "Add tab");
check(await page.getByRole("tab", { name: "Cross" }).isDisabled(), "Cross disabled in 2D");

await page.getByRole("tab", { name: "Add" }).click();
await page.waitForTimeout(150);
const output = page.locator("pre").first();
const addOut = await output.innerText();
check(addOut.includes("A + B"), `add output: ${addOut.replace(/\n/g, " | ")}`);

await page.getByRole("tab", { name: "Dot" }).click();
await page.waitForTimeout(150);
const dotOut = await output.innerText();
check(dotOut.includes("A · B") || dotOut.includes("A · B"), `dot output: ${dotOut}`);

await page.getByRole("button", { name: "About Dot product" }).click();
check(await page.getByRole("note").count().then((n) => n === 1), "inline help visible");

await page.getByRole("tab", { name: "M×v" }).click();
await page.waitForTimeout(200);
check(await page.getByLabel("Matrix M, 2 by 2").count().then((n) => n === 1), "2x2 matrix shown");

await page.getByRole("button", { name: "3D mode" }).click();
await page.waitForTimeout(800);
check(await page.getByLabel("Rotate camera around the scene").count().then((n) => n === 1), "rotate slider");
check(await page.getByRole("tab", { name: "Cross" }).isEnabled(), "Cross enabled in 3D");

await page.getByRole("tab", { name: "Cross" }).click();
await page.waitForTimeout(200);
const crossOut = await output.innerText();
check(crossOut.includes("A × B"), `cross output: ${crossOut.replace(/\n/g, " | ")}`);

await page.getByRole("tab", { name: "M×M" }).click();
await page.waitForTimeout(200);
check(await page.getByLabel("Matrix M, 3 by 3").count().then((n) => n === 1), "3x3 M shown");
check(await page.getByLabel("Matrix N, 3 by 3").count().then((n) => n === 1), "3x3 N shown");

await page.screenshot({ path: `${shotDir}/desktop-3d.png`, fullPage: true });

await page.getByRole("button", { name: "Reset" }).click();
await page.waitForTimeout(200);
check(await page.getByRole("tab", { name: "Visualize" }).getAttribute("aria-selected") === "true", "reset to visualize");
check(await page.getByRole("button", { name: "2D mode" }).getAttribute("aria-pressed") === "true", "reset to 2D");

await page.getByRole("tab", { name: "Add" }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${shotDir}/desktop-add.png`, fullPage: true });

await page.getByRole("tab", { name: "Scalar" }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${shotDir}/desktop-scalar.png`, fullPage: true });

await page.getByRole("tab", { name: "M×v" }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${shotDir}/desktop-mxv.png`, fullPage: true });

await page.getByRole("tab", { name: "Visualize" }).click();
await page.screenshot({ path: `${shotDir}/desktop-2d.png`, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${shotDir}/mobile-2d.png`, fullPage: true });

await page.getByRole("button", { name: "3D mode" }).click();
await page.waitForTimeout(800);
check(await page.getByLabel("Rotate camera around the scene").isVisible(), "rotate slider on mobile");
await page.screenshot({ path: `${shotDir}/mobile-3d.png`, fullPage: true });

await page.getByRole("button", { name: "About Scalar multiplication" }).click();
check(await page.getByRole("note").innerText().then((t) => t.toLowerCase().includes("scalar")), "scalar help");

await browser.close();

if (errors.length) {
  console.error("\n" + errors.length + " failure(s)");
  process.exit(1);
}
console.log("\ne2e ok");
