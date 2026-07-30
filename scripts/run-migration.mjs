// Applies a .sql migration file over the Neon HTTP driver (port 443),
// the same transport the app uses. Usage: node scripts/run-migration.mjs <file.sql>
// Self-check: node scripts/run-migration.mjs --self-check
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";

// Splits on top-level semicolons only: a `;` inside a -- comment, a '...' literal,
// or a $tag$...$tag$ body is not a statement boundary.
function splitStatements(raw) {
  const out = [];
  let buf = "";
  let i = 0;
  while (i < raw.length) {
    if (raw.startsWith("--", i)) {
      const nl = raw.indexOf("\n", i);
      i = nl === -1 ? raw.length : nl;
      continue;
    }
    if (raw[i] === "'") {
      const end = raw.indexOf("'", i + 1);
      const stop = end === -1 ? raw.length : end + 1;
      buf += raw.slice(i, stop);
      i = stop;
      continue;
    }
    const tag = /^\$[A-Za-z_]*\$/.exec(raw.slice(i))?.[0];
    if (tag) {
      const end = raw.indexOf(tag, i + tag.length);
      const stop = end === -1 ? raw.length : end + tag.length;
      buf += raw.slice(i, stop);
      i = stop;
      continue;
    }
    if (raw[i] === ";") {
      out.push(buf);
      buf = "";
      i += 1;
      continue;
    }
    buf += raw[i];
    i += 1;
  }
  out.push(buf);
  return out.map((s) => s.trim()).filter(Boolean);
}

function selfCheck() {
  assert.equal(splitStatements("SELECT 1; SELECT 2").length, 2);
  // The bug this guards: a semicolon inside an inline comment split a CREATE TABLE in half.
  assert.equal(splitStatements("CREATE TABLE t (\n a int, -- id; and more\n b int\n);").length, 1);
  assert.equal(splitStatements("SELECT ';' AS x;").length, 1);
  assert.equal(splitStatements("DO $$ BEGIN PERFORM 1; END $$;").length, 1);
  assert.equal(splitStatements("-- only a comment\n").length, 0);
  console.log("self-check ok");
}

const file = process.argv[2];
if (!file) throw new Error("usage: run-migration.mjs <file.sql|--self-check>");

if (file === "--self-check") {
  selfCheck();
} else {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const sql = neon(url);
  const statements = splitStatements(readFileSync(file, "utf8"));
  for (const stmt of statements) {
    await sql.query(stmt);
    console.log("ok:", stmt.slice(0, 60).replace(/\s+/g, " "));
  }
  console.log(`done: ${statements.length} statements from ${file}`);
}
