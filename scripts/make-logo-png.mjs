import { chromium } from "playwright";
import { join } from "node:path";

const OUT_DIR = new URL("../public", import.meta.url).pathname;

const LOGOS = [
  {
    // Solid Dark Green Square with White Symbol (Standard square logo)
    name: "logo.png",
    width: 512,
    height: 512,
    html: `
      <svg viewBox="0 0 64 64" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="#1f2a1d" />
        <g stroke="#f5f3ec" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M47 21 A16 16 0 1 0 47 43" />
          <path d="M22 27 L29 40 L36 27" />
          <path d="M34 27 L41 40 L48 27" opacity="0.55" />
        </g>
      </svg>
    `
  },
  {
    // Solid White Square with Dark Green Symbol (Standard white square logo)
    name: "logo-white.png",
    width: 512,
    height: 512,
    html: `
      <svg viewBox="0 0 64 64" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="#ffffff" />
        <g stroke="#1f2a1d" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M47 21 A16 16 0 1 0 47 43" />
          <path d="M22 27 L29 40 L36 27" />
          <path d="M34 27 L41 40 L48 27" opacity="0.55" />
        </g>
      </svg>
    `
  },
  {
    // Stacked Dark Green Square (Symbol + Text)
    name: "logo-stacked.png",
    width: 512,
    height: 512,
    html: `
      <svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#1f2a1d" />
        <svg viewBox="0 0 64 64" x="146" y="90" width="220" height="220">
          <g stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M47 19 A18 18 0 1 0 47 45" />
            <path d="M19 26 L28 42 L37 26" />
            <path d="M33 26 L42 42 L51 26" opacity="0.45" />
          </g>
        </svg>
        <text x="256" y="380" text-anchor="middle" font-family="Inter, sans-serif" font-size="64" font-weight="600" letter-spacing="-2.4" fill="#ffffff">creativv</text>
        <circle cx="392" cy="340" r="5.6" fill="#ffffff" />
      </svg>
    `
  },
  {
    // Stacked White Square (Symbol + Text)
    name: "logo-stacked-white.png",
    width: 512,
    height: 512,
    html: `
      <svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#ffffff" />
        <svg viewBox="0 0 64 64" x="146" y="90" width="220" height="220">
          <g stroke="#1f2a1d" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M47 19 A18 18 0 1 0 47 45" />
            <path d="M19 26 L28 42 L37 26" />
            <path d="M33 26 L42 42 L51 26" opacity="0.45" />
          </g>
        </svg>
        <text x="256" y="380" text-anchor="middle" font-family="Inter, sans-serif" font-size="64" font-weight="600" letter-spacing="-2.4" fill="#1f2a1d">creativv</text>
        <circle cx="392" cy="340" r="5.6" fill="#1f2a1d" />
      </svg>
    `
  },
  {
    // Transparent Square with Dark Green Symbol
    name: "logo-bare.png",
    width: 512,
    height: 512,
    html: `
      <svg viewBox="0 0 64 64" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#1f2a1d" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M47 19 A18 18 0 1 0 47 45" />
          <path d="M19 26 L28 42 L37 26" />
          <path d="M33 26 L42 42 L51 26" opacity="0.45" />
        </g>
      </svg>
    `
  },
  {
    // Transparent Square with White Symbol
    name: "logo-bare-white.png",
    width: 512,
    height: 512,
    html: `
      <svg viewBox="0 0 64 64" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M47 19 A18 18 0 1 0 47 45" />
          <path d="M19 26 L28 42 L37 26" />
          <path d="M33 26 L42 42 L51 26" opacity="0.45" />
        </g>
      </svg>
    `
  }
];

async function main() {
  const browser = await chromium.launch();
  console.log("Browser launched.");

  for (const logo of LOGOS) {
    const ctx = await browser.newContext({
      viewport: { width: logo.width, height: logo.height },
      deviceScaleFactor: 1
    });
    const page = await ctx.newPage();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: ${logo.width}px;
            height: ${logo.height}px;
            background: transparent;
            overflow: hidden;
          }
          #logo {
            display: block;
            width: ${logo.width}px;
            height: ${logo.height}px;
            box-sizing: border-box;
          }
          svg {
            display: block;
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="logo">
          ${logo.html}
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    const outPath = join(OUT_DIR, logo.name);

    // Take screenshot of the exact page viewport to guarantee 512x512 size
    await page.screenshot({
      path: outPath,
      omitBackground: true,
      type: "png"
    });

    console.log(`✓ Generated ${logo.name} (exactly ${logo.width}x${logo.height} px)`);
    await ctx.close();
  }

  await browser.close();
  console.log("Done generating logos.");
}

main().catch(console.error);
