// Applies a .sql migration file over the Neon HTTP driver (port 443),
// the same transport the app uses. Usage: node scripts/run-migration.mjs <file.sql>
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const file = process.argv[2];
if (!file) throw new Error("usage: run-migration.mjs <file.sql>");

const sql = neon(url);
const raw = readFileSync(file, "utf8");

// Strip line comments, then split into statements on semicolons.
const statements = raw
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
  console.log("ok:", stmt.slice(0, 60).replace(/\s+/g, " "));
}
console.log(`done: ${statements.length} statements from ${file}`);
