import { PrismaClient } from '@prisma/client'
import { resolveDatabaseUrl } from '@/lib/wcc/db-url'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * DATABASE_URL normalization is shared with the Prisma CLI wrapper
 * (`scripts/db.ts`) via `src/lib/wcc/db-url.ts` — contract-locked by
 * `src/lib/wcc/__tests__/db-url.test.ts`. It rewrites relative `file:`
 * URLs pointing at `db/custom.db` to an absolute repo-root path so the
 * CLI, dev server, and the standalone runtime (which chdirs to
 * `.next/standalone`) all land on the SAME SQLite file.
 */
const datasourceUrl = resolveDatabaseUrl(process.env.DATABASE_URL)

// Query logging is dev-only: production logs must stay quiet (and PII-free).
const prismaOptions: ConstructorParameters<typeof PrismaClient>[0] = {
  ...(datasourceUrl ? { datasourceUrl } : {}),
  ...(process.env.NODE_ENV !== 'production' ? { log: ['query'] as const } : {}),
}

export const db = globalForPrisma.prisma ?? new PrismaClient(prismaOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
