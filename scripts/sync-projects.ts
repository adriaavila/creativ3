/**
 * Regenera capturas y metadata de GitHub del portafolio.
 *
 *   pnpm sync:projects            # todo
 *   pnpm sync:projects shopea rei # solo esos ids
 *
 * Lee la lista desde src/lib/projects.ts (fuente de verdad del copy) y escribe:
 *   - public/projects/<id>/{01-desktop,02-desktop-scroll,03-mobile}.<ext>
 *   - src/data/projects-sync.json  (fechas de GitHub + rutas de imagen)
 *
 * El copy NUNCA se toca aqui: solo lo volatil.
 */
import { chromium, type Page } from "playwright";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { CURATED_IMAGES } from "../src/lib/project-editorial";
import { PORTFOLIO_PROJECTS, type ProjectImage } from "../src/lib/projects";

const execFileAsync = promisify(execFile);

const ROOT = new URL("..", import.meta.url).pathname;
const OUT_BASE = join(ROOT, "public/projects");
const SYNC_FILE = join(ROOT, "src/data/projects-sync.json");

const SHOTS = [
  { file: "01-desktop", label: "Desktop", viewport: { width: 1440, height: 900 } },
  { file: "02-desktop-scroll", label: "Scroll", viewport: { width: 1440, height: 900 }, scrollY: 900 },
  { file: "03-mobile", label: "Mobile", viewport: { width: 390, height: 844 } },
] as const;

type SyncEntry = {
  githubPushedAt?: string;
  githubUpdatedLabel?: string;
  images?: ProjectImage[];
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function spanishDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** owner/repo desde una sourceUrl de GitHub, o null si no es una. */
function repoSlug(sourceUrl: string | undefined): string | null {
  const m = sourceUrl?.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/);
  return m ? m[1] : null;
}

/**
 * Un pop-up que se abre al llegar (un webinar, un boletín) tapa la página:
 * se cierra como lo cerraría una visita, con Escape o con su botón de cerrar.
 */
async function closePopups(page: Page) {
  const open = page.locator('[role="dialog"]:visible, [aria-modal="true"]:visible, dialog[open]');
  if ((await open.count()) === 0) return;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  // El primer «cerrar» puede ser el fondo sobre el que está el diálogo: se prueban en orden.
  const buttons = open.first().getByRole("button", { name: /close|cerrar|maybe later|not now|ahora no|más tarde/i });
  const n = Math.min(await buttons.count(), 4);
  for (let i = 0; i < n && (await open.count()) > 0; i++) {
    await buttons.nth(i).click({ timeout: 1_500 }).catch(() => {});
    await page.waitForTimeout(600);
  }
}

async function capture(page: Page, url: string, out: string, shot: (typeof SHOTS)[number]) {
  await page.setViewportSize(shot.viewport);
  await page
    .goto(url, { waitUntil: "networkidle", timeout: 45_000 })
    .catch(() => page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 }));
  await page.waitForTimeout(2_500);
  await closePopups(page);
  if ("scrollY" in shot && shot.scrollY) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), shot.scrollY);
    await page.waitForTimeout(1_200);
  }
  // ponytail: playwright solo emite png/jpeg — jpeg pesa menos y basta para un portafolio.
  await page.screenshot({ path: out, type: "jpeg", quality: 82 });
}

async function githubPushedAt(slug: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("gh", ["api", `repos/${slug}`, "--jq", ".pushed_at"]);
    return stdout.trim() || null;
  } catch {
    return null; // repo privado sin acceso, gh no instalado, o sin red: no es fatal
  }
}

async function main() {
  const only = new Set(process.argv.slice(2));
  const targets = PORTFOLIO_PROJECTS.filter((p) => only.size === 0 || only.has(p.id));
  if (targets.length === 0) throw new Error(`Ningun proyecto coincide con: ${[...only].join(", ")}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const out: Record<string, SyncEntry> = {};
  let failed = 0;

  for (const project of targets) {
    const entry: SyncEntry = {};

    const slug = repoSlug(project.sourceUrl);
    if (slug) {
      const pushedAt = await githubPushedAt(slug);
      if (pushedAt) {
        entry.githubPushedAt = pushedAt;
        entry.githubUpdatedLabel = spanishDate(pushedAt);
      }
    }

    if (project.liveUrl && !(project.id in CURATED_IMAGES)) {
      const dir = join(OUT_BASE, project.id);
      await mkdir(dir, { recursive: true });
      const images: ProjectImage[] = [];
      for (const shot of SHOTS) {
        const rel = `/projects/${project.id}/${shot.file}.jpg`;
        try {
          await capture(page, project.liveUrl, join(dir, `${shot.file}.jpg`), shot);
          images.push({ src: rel, alt: `${project.name} — ${shot.label}`, label: shot.label, width: shot.viewport.width * 2, height: shot.viewport.height * 2 });
        } catch (e) {
          failed += 1;
          console.error(`  ✗ ${project.id} ${shot.file}: ${(e as Error).message}`);
        }
      }
      // Solo publicamos el set si esta completo: media captura se ve peor que ninguna.
      if (images.length === SHOTS.length) entry.images = images;
    }

    if (Object.keys(entry).length > 0) out[project.id] = entry;
    console.log(`✓ ${project.id}${entry.images ? "" : project.liveUrl ? " (sin capturas)" : " (sin liveUrl)"}`);
  }

  await browser.close();

  // Un sync filtrado actualiza solo esos ids: el resto del archivo se conserva.
  const previous = JSON.parse(await readFile(SYNC_FILE, "utf8")) as {
    projects?: Record<string, SyncEntry>;
  };
  const projects = { ...(previous.projects ?? {}), ...out };

  const syncedAt = new Date().toISOString().slice(0, 10);
  await writeFile(SYNC_FILE, `${JSON.stringify({ syncedAt, projects }, null, 2)}\n`, "utf8");
  console.log(`\n${Object.keys(out).length} proyectos sincronizados → src/data/projects-sync.json`);
  if (failed > 0) console.log(`${failed} capturas fallaron (ver arriba).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
