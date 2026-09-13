/**
 * Prisma CLI wrapper — guarantees `db:push` / `db:migrate` / `db:reset`
 * target the SAME SQLite file the app runtime uses.
 *
 * Why: two proven resolution hazards make `db:*` commands non-deterministic
 * unless pinned:
 *
 *   1. Prisma resolves relative `file:` URLs in the DATABASE_URL env var
 *      from the schema directory (CLI) while the runtime driver resolves
 *      them from the process CWD — the same relative value lands on
 *      different files for CLI vs server. The shared resolver in
 *      `src/lib/wcc/db-url.ts` re-anchors both to `<repo>/db/custom.db`.
 *   2. bun auto-loads `.env` files from parent directories, and CI/sandbox
 *      shells often export a DATABASE_URL of their own — either can silently
 *      override the repo's `.env` and point prisma at an out-of-repo file
 *      (reproduced in a real sandbox: CLI targeted <workspace-parent>/db).
 *
 * Fix: resolve DATABASE_URL with the same shared, contract-locked resolver
 * the app uses, export the absolute URL to the prisma child process, and
 * exec prisma. Process env wins over .env for the child (dotenv does not
 * override existing vars), so prisma lands on the same file as the runtime.
 *
 * Usage: bun scripts/db.ts <prisma args...>
 *   e.g. bun scripts/db.ts db push --accept-data-loss
 */
import fs from "node:fs";
import path from "node:path";
import { resolveDatabaseUrl } from "../src/lib/wcc/db-url";

function loadDotEnvFallback(): void {
  if (process.env.DATABASE_URL) return; // bun auto-loads .env; or caller set it
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const match = fs.readFileSync(envPath, "utf8").match(/^DATABASE_URL\s*=\s*(.+)$/m);
  if (match) process.env.DATABASE_URL = match[1].trim();
}

async function main(): Promise<void> {
  loadDotEnvFallback();
  const resolved = resolveDatabaseUrl(process.env.DATABASE_URL);
  if (resolved) {
    process.env.DATABASE_URL = resolved;
    console.error(`[db] DATABASE_URL resolved to ${resolved}`);
  } else {
    console.error("[db] DATABASE_URL is not set — prisma will fail; copy .env.example to .env first.");
  }

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("[db] usage: bun scripts/db.ts <prisma args...>");
    process.exit(2);
  }

  const child = Bun.spawn(["bunx", "prisma", ...args], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
    env: process.env,
  });
  const code = await child.exited;
  process.exit(code ?? 1);
}

await main();
