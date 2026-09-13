import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Normalize DATABASE_URL for SQLite so both `prisma db push` (relative to
 * prisma/) and the standalone runtime (cwd = repo root, `bun
 * .next/standalone/server.js`) resolve to the same file.
 *
 * Prisma resolves `file:../db/custom.db` relative to `prisma/` for the CLI,
 * but the runtime driver resolves relative to `process.cwd()` (repo root),
 * so `../db/custom.db` from the repo root is wrong. We rewrite any
 * `file:` URL that points at `db/custom.db` to an absolute path.
 */
function resolvedDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined
  if (!raw.startsWith('file:')) return raw
  const filePart = raw.slice(5)
  // Already absolute (file:/... or file:///...) — leave as-is.
  if (path.isAbsolute(filePart)) return raw
  // Any relative that ends with db/custom.db → resolve to repo-root absolute.
  // Covers both `file:../db/custom.db` (portable) and `file:db/custom.db` (stale).
  // The standalone server chdirs to .next/standalone (see server.js
  // `process.chdir(__dirname)`), so cwd there is standalone — walk up.
  if (filePart.includes('db/custom.db') || filePart.includes('db\\custom.db')) {
    const cwd = process.cwd()
    const isStandalone = cwd.includes('.next/standalone')
    const absolute = isStandalone
      ? path.resolve(cwd, '../../db/custom.db')
      : path.resolve(cwd, 'db/custom.db')
    return `file:${absolute}`
  }
  return raw
}

const datasourceUrl = resolvedDatabaseUrl()

// Query logging is dev-only: production logs must stay quiet (and PII-free).
const prismaOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  ...(datasourceUrl ? { datasourceUrl } : {}),
  ...(process.env.NODE_ENV !== 'production' ? { log: ['query'] as const } : {}),
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(Object.keys(prismaOptions).length ? prismaOptions : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
