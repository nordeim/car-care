import path from "node:path";

/**
 * Shared DATABASE_URL resolver for SQLite — the single source of truth used
 * by BOTH the app runtime (`src/lib/db.ts`) and the Prisma CLI wrapper
 * (`scripts/db.ts`).
 *
 * Why this exists: Prisma resolves relative `file:` URLs in the DATABASE_URL
 * *environment variable* against the process CWD, not the schema directory
 * (the "relative to prisma/" rule only applies to URLs written inline in
 * schema.prisma). Different processes therefore resolve the same relative
 * URL to different files:
 *
 *   - `prisma db push` run from the repo root  → <repo-parent>/db/custom.db ✗
 *   - dev server (cwd = repo root)             → <repo>/db/custom.db        ✓
 *   - standalone server (chdir'd to
 *     `.next/standalone` by server.js)         → <repo>/db/custom.db        ✓
 *
 * This function rewrites any relative `file:` URL that points at
 * `db/custom.db` to an absolute repo-root path so every consumer lands on
 * the same file. The standalone case is detected via the chdir'd cwd
 * (`process.chdir(__dirname)` in `.next/standalone/server.js`) and walks up
 * two levels.
 *
 * Behavior is contract-locked by `src/lib/wcc/__tests__/db-url.test.ts`.
 */
export function resolveDatabaseUrl(
  raw: string | undefined,
  cwd: string = process.cwd(),
): string | undefined {
  if (!raw) return undefined;
  if (!raw.startsWith("file:")) return raw;
  const filePart = raw.slice(5);
  // Already absolute (file:/... or file:///...) — leave as-is.
  if (path.isAbsolute(filePart)) return raw;
  // Any relative that ends with db/custom.db → resolve to repo-root absolute.
  // Covers both `file:../db/custom.db` (portable) and `file:db/custom.db` (stale).
  if (filePart.includes("db/custom.db") || filePart.includes("db\\custom.db")) {
    const isStandalone = cwd.includes(".next/standalone");
    const absolute = isStandalone
      ? path.resolve(cwd, "../../db/custom.db")
      : path.resolve(cwd, "db/custom.db");
    return `file:${absolute}`;
  }
  return raw;
}
