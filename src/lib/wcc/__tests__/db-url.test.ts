import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "../db-url";

/**
 * Contract tests for the shared DATABASE_URL resolver.
 *
 * Worked examples (independent source of truth — a real directory layout):
 *   repo root     = /srv/car-care
 *   runtime (dev) cwd = /srv/car-care            → /srv/car-care/db/custom.db
 *   standalone cwd    = /srv/car-care/.next/standalone
 *                     (server.js chdirs here)    → /srv/car-care/db/custom.db
 *   CLI wrapper cwd   = repo root                → /srv/car-care/db/custom.db
 *
 * These tests lock the behavior that both `src/lib/db.ts` (app runtime) and
 * `scripts/db.ts` (prisma CLI wrapper) must share, so `prisma db push` and
 * the server always land on the SAME SQLite file regardless of which cwd
 * each process starts in.
 */

const ROOT = "/srv/car-care";

describe("resolveDatabaseUrl", () => {
  it("resolves the portable relative URL against the repo-root cwd", () => {
    expect(resolveDatabaseUrl("file:../db/custom.db", ROOT)).toBe(
      `file:${ROOT}/db/custom.db`,
    );
  });

  it("walks up two levels from the standalone cwd (.next/standalone chdir trap)", () => {
    expect(
      resolveDatabaseUrl("file:../db/custom.db", `${ROOT}/.next/standalone`),
    ).toBe(`file:${ROOT}/db/custom.db`);
  });

  it("resolves a stale repo-relative URL (file:db/custom.db) to the repo root", () => {
    expect(resolveDatabaseUrl("file:db/custom.db", ROOT)).toBe(
      `file:${ROOT}/db/custom.db`,
    );
  });

  it("leaves absolute file: URLs untouched", () => {
    expect(resolveDatabaseUrl("file:/data/wcc/custom.db", ROOT)).toBe(
      "file:/data/wcc/custom.db",
    );
    expect(resolveDatabaseUrl("file:///data/wcc/custom.db", ROOT)).toBe(
      "file:///data/wcc/custom.db",
    );
  });

  it("leaves non-file connection URLs untouched", () => {
    expect(resolveDatabaseUrl("postgres://u:p@h:5432/db", ROOT)).toBe(
      "postgres://u:p@h:5432/db",
    );
  });

  it("leaves relative URLs that do not point at db/custom.db untouched", () => {
    expect(resolveDatabaseUrl("file:./other.sqlite", ROOT)).toBe(
      "file:./other.sqlite",
    );
  });

  it("returns undefined when no DATABASE_URL is set", () => {
    expect(resolveDatabaseUrl(undefined, ROOT)).toBeUndefined();
  });

  it("defaults cwd to process.cwd() when omitted", () => {
    expect(resolveDatabaseUrl("file:db/custom.db")).toBe(
      `file:${process.cwd()}/db/custom.db`,
    );
  });
});
