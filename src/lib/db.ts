import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Query logging is dev-only: production logs must stay quiet (and PII-free).
export const db =
  globalForPrisma.prisma ??
  new PrismaClient(
    process.env.NODE_ENV === 'production'
      ? undefined
      : { log: ['query'] },
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
