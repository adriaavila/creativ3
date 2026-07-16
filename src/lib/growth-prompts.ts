import { readFile } from "node:fs/promises";
import path from "node:path";

export type GrowthPromptInfo = {
  id: string;
  name: string;
  role: string;
  sourcePath: string;
  content: string;
};

const PROMPTS = [
  {
    id: "director",
    name: "Growth Director",
    role: "Orquesta campañas, investigación, borradores y CRM.",
    file: "instructions.md",
  },
  {
    id: "researcher",
    name: "Lead Researcher",
    role: "Encuentra y audita negocios con evidencia pública.",
    file: "subagents/lead-researcher/instructions.md",
  },
  {
    id: "copywriter",
    name: "Copywriter Comercial",
    role: "Redacta secuencias y propuestas para revisión humana.",
    file: "subagents/copywriter/instructions.md",
  },
  {
    id: "content",
    name: "Content Lead",
    role: "Adapta evidencia de campaña a contenido por canal.",
    file: "subagents/content/instructions.md",
  },
] as const;

export async function getGrowthPromptRegistry(): Promise<GrowthPromptInfo[]> {
  const promptRoot = path.join(process.cwd(), "apps/growth-agent/agent");
  return Promise.all(
    PROMPTS.map(async ({ file, ...prompt }) => ({
      ...prompt,
      sourcePath: `apps/growth-agent/agent/${file}`,
      content: await readFile(path.join(promptRoot, file), "utf8"),
    })),
  );
}
