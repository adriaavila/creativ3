import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const PROJECTS = [
  { slug: "pace-running", url: "https://pace-running-three.vercel.app" },
  { slug: "rei-fm", url: "https://rei-fm.vercel.app" },
  { slug: "soapy", url: "https://soapy-sooty.vercel.app" },
  { slug: "artistheway", url: "https://artistheway.vercel.app" },
  { slug: "taller-samer", url: "https://taller-samer.vercel.app" },
  { slug: "mistica", url: "https://mistica-app-fawn.vercel.app" },
];

const OUT_BASE = new URL("../public/projects", import.meta.url).pathname;

async function capture(page, url, outPath, opts) {
  await page.setViewportSize(opts.viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(async () => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  });
  // Allow animations to settle
  await page.waitForTimeout(2500);
  if (opts.scrollY) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), opts.scrollY);
    await page.waitForTimeout(1200);
  }
  await page.screenshot({
    path: outPath,
    type: "jpeg",
    quality: 82,
    fullPage: false,
  });
  console.log("✓", outPath);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  for (const p of PROJECTS) {
    const dir = join(OUT_BASE, p.slug);
    await mkdir(dir, { recursive: true });
    try {
      // 1. Desktop hero
      await capture(page, p.url, join(dir, "01-desktop.jpg"), {
        viewport: { width: 1440, height: 900 },
      });
      // 2. Desktop scrolled
      await capture(page, p.url, join(dir, "02-desktop-scroll.jpg"), {
        viewport: { width: 1440, height: 900 },
        scrollY: 900,
      });
      // 3. Mobile
      await capture(page, p.url, join(dir, "03-mobile.jpg"), {
        viewport: { width: 390, height: 844 },
      });
    } catch (e) {
      console.error("✗", p.slug, e.message);
    }
  }

  await browser.close();
})();
