import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type EveMode = "simulation" | "shadow" | "approval" | "production";

export type EveCatalogFile = {
  id: string;
  label: string;
  sourcePath: string;
  description: string;
};

export type EveToolCatalogFile = EveCatalogFile & {
  status: "enabled" | "disabled" | "unclassified";
};

export type EveSubagentCatalogFile = EveCatalogFile & {
  toolCount: number;
  hasInstructions: boolean;
};

export type EveScheduleCatalogFile = EveCatalogFile & {
  cron: string | null;
};

export type EveEvalCatalogFile = EveCatalogFile & {
  usesJudge: boolean;
};

export type EveAgentCatalog = {
  generatedAt: string;
  agent: {
    name: string;
    packageVersion: string | null;
    sourcePath: string;
    description: string;
    instructionsPath: string;
    instructionsPreview: string;
    guardrails: string[];
  };
  runtime: {
    packageVersion: string | null;
    model: string;
    modelCredentialConfigured: boolean;
    channelAuthConfigured: boolean;
  };
  tools: EveToolCatalogFile[];
  channels: EveCatalogFile[];
  subagents: EveSubagentCatalogFile[];
  schedules: EveScheduleCatalogFile[];
  evals: EveEvalCatalogFile[];
  evalConfig: {
    sourcePath: string;
    discovered: boolean;
    usesJudge: boolean;
  };
};

const APP_ROOT = path.join(process.cwd(), "apps/growth-agent");

async function readText(relativePath: string) {
  try {
    return await readFile(path.join(APP_ROOT, relativePath), "utf8");
  } catch {
    return null;
  }
}

async function listFiles(relativeDirectory: string, predicate: (file: string) => boolean): Promise<string[]> {
  const directory = path.join(APP_ROOT, relativeDirectory);
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested: string[][] = await Promise.all(
      entries.map(async (entry) => {
        const relativePath = path.join(relativeDirectory, entry.name);
        if (entry.isDirectory()) return listFiles(relativePath, predicate);
        return predicate(relativePath) ? [relativePath] : [];
      }),
    );
    return nested.flat().sort();
  } catch {
    return [];
  }
}

function humanize(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function truncate(value: string, length = 420) {
  const clean = value.replace(/\0/g, "").trim();
  return clean.length > length ? `${clean.slice(0, length).trimEnd()}…` : clean;
}

function descriptionFrom(source: string | null, fallback: string) {
  if (!source) return fallback;
  const match = source.match(/description\s*:\s*["'`]([^"'`]+)["'`]/);
  return truncate(match?.[1] ?? fallback, 240);
}

function firstBodyParagraph(source: string | null, fallback: string) {
  if (!source) return fallback;
  const body = source.replace(/^---[\s\S]*?---/, "");
  const line = body
    .split("\n")
    .map((item) => item.replace(/^[-*]\s+/, "").trim())
    .find((item) => item.length > 24 && !item.startsWith("#"));
  return truncate(line ?? fallback, 240);
}

function frontMatterValue(source: string | null, key: string) {
  if (!source) return null;
  return source.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)`, "m"))?.[1]?.trim() ?? null;
}

function instructionHighlights(source: string | null) {
  if (!source) return [];
  return source
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => line.length > 28 && !line.startsWith("#") && !/^\d+\./.test(line))
    .slice(0, 5)
    .map((line) => truncate(line, 180));
}

async function packageInfo() {
  const source = await readText("package.json");
  if (!source) return { name: "Growth Director", version: null };
  try {
    const value = JSON.parse(source) as { name?: unknown; version?: unknown };
    return {
      name: typeof value.name === "string" ? value.name : "Growth Director",
      version: typeof value.version === "string" ? value.version : null,
    };
  } catch {
    return { name: "Growth Director", version: null };
  }
}

export async function getEveAgentCatalog(): Promise<EveAgentCatalog> {
  const [packageMeta, agentSource, instructionsSource, channelFiles, toolFiles, subagentFiles, scheduleFiles, evalFiles, evalConfigSource] = await Promise.all([
    packageInfo(),
    readText("agent/agent.ts"),
    readText("agent/instructions.md"),
    listFiles("agent/channels", (file) => file.endsWith(".ts")),
    listFiles("agent/tools", (file) => file.endsWith(".ts")),
    listFiles("agent/subagents", (file) => file.endsWith("/agent.ts")),
    listFiles("agent/schedules", (file) => file.endsWith(".md") || file.endsWith(".ts")),
    listFiles("evals", (file) => file.endsWith(".eval.ts")),
    readText("evals/evals.config.ts"),
  ]);

  const tools = await Promise.all(
    toolFiles.map(async (sourcePath): Promise<EveToolCatalogFile> => {
      const source = await readText(sourcePath.replaceAll(path.sep, "/"));
      const disabled = source?.includes("disableTool()") ?? false;
      return {
        id: sourcePath.replace(/^agent\/tools\//, "").replace(/\.ts$/, ""),
        label: humanize(sourcePath.split(path.sep).at(-1) ?? sourcePath),
        sourcePath: sourcePath.replaceAll(path.sep, "/"),
        description: descriptionFrom(source, "Herramienta Eve descubierta en el repositorio."),
        status: disabled ? "disabled" : source?.includes("defineTool") ? "enabled" : "unclassified",
      };
    }),
  );

  const channels = await Promise.all(
    channelFiles.map(async (sourcePath): Promise<EveCatalogFile> => {
      const source = await readText(sourcePath.replaceAll(path.sep, "/"));
      return {
        id: sourcePath.replace(/^agent\/channels\//, "").replace(/\.ts$/, ""),
        label: sourcePath.endsWith("/eve.ts") || sourcePath === "agent/channels/eve.ts" ? "Eve HTTP" : humanize(sourcePath.split(path.sep).at(-1) ?? sourcePath),
        sourcePath: sourcePath.replaceAll(path.sep, "/"),
        description: source?.includes("httpBasic")
          ? "Canal HTTP de Eve con desarrollo local y autenticación HTTP Basic opcional."
          : "Canal de entrada y salida descubierto por Eve.",
      };
    }),
  );

  const subagents = await Promise.all(
    [...new Set(subagentFiles.map((file) => path.dirname(file)))].map(async (directory): Promise<EveSubagentCatalogFile> => {
      const agentPath = path.join(directory, "agent.ts").replaceAll(path.sep, "/");
      const instructionsPath = path.join(directory, "instructions.md").replaceAll(path.sep, "/");
      const [source, instructions, childTools] = await Promise.all([
        readText(agentPath),
        readText(instructionsPath),
        listFiles(path.join(directory, "tools").replaceAll(path.sep, "/"), (file) => file.endsWith(".ts")),
      ]);
      const id = path.basename(directory);
      return {
        id,
        label: humanize(id),
        sourcePath: agentPath,
        description: descriptionFrom(source, firstBodyParagraph(instructions, "Subagente declarado en Eve.")),
        toolCount: childTools.length,
        hasInstructions: Boolean(instructions),
      };
    }),
  );

  const schedules = await Promise.all(
    scheduleFiles.map(async (sourcePath): Promise<EveScheduleCatalogFile> => {
      const source = await readText(sourcePath.replaceAll(path.sep, "/"));
      return {
        id: sourcePath.replace(/^agent\/schedules\//, "").replace(/\.(md|ts)$/, ""),
        label: humanize(sourcePath.split(path.sep).at(-1) ?? sourcePath),
        sourcePath: sourcePath.replaceAll(path.sep, "/"),
        cron: frontMatterValue(source, "cron") ?? source?.match(/cron\s*:\s*["']([^"']+)/)?.[1] ?? null,
        description: firstBodyParagraph(source, "Schedule raíz administrado por Eve."),
      };
    }),
  );

  const evals = await Promise.all(
    evalFiles.map(async (sourcePath): Promise<EveEvalCatalogFile> => {
      const source = await readText(sourcePath.replaceAll(path.sep, "/"));
      const id = sourcePath.replace(/^evals\//, "").replace(/\.eval\.ts$/, "");
      return {
        id,
        label: humanize(id),
        sourcePath: sourcePath.replaceAll(path.sep, "/"),
        description: descriptionFrom(source, "Evaluación Eve descubierta en el repositorio."),
        usesJudge: Boolean(source?.includes("judge.")),
      };
    }),
  );

  return {
    generatedAt: new Date().toISOString(),
    agent: {
      name: packageMeta.name,
      packageVersion: packageMeta.version,
      sourcePath: "apps/growth-agent/agent/agent.ts",
      description: "Orquesta investigación, borradores, CRM y contenido con revisión humana.",
      instructionsPath: "apps/growth-agent/agent/instructions.md",
      instructionsPreview: truncate(instructionsSource ?? "No se encontró instructions.md.", 620),
      guardrails: instructionHighlights(instructionsSource),
    },
    runtime: {
      packageVersion: (await readText("package.json"))?.match(/"eve"\s*:\s*"([^"]+)"/)?.[1] ?? null,
      model: agentSource?.includes("gateway(") ? "Vercel AI Gateway" : "Modelo definido en agent.ts",
      modelCredentialConfigured: Boolean(process.env.AI_GATEWAY_API_KEY || process.env.GROWTH_MODEL),
      channelAuthConfigured: Boolean(process.env.GROWTH_AGENT_USERNAME && process.env.GROWTH_AGENT_PASSWORD),
    },
    tools,
    channels,
    subagents,
    schedules,
    evals,
    evalConfig: {
      sourcePath: "apps/growth-agent/evals/evals.config.ts",
      discovered: Boolean(evalConfigSource),
      usesJudge: Boolean(evalConfigSource?.includes("judge:")),
    },
  };
}
