import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString: datasourceUrl,
});

// Preserve singleton in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
