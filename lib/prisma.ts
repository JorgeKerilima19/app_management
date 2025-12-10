import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"; // or your DB adapter

const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString: datasourceUrl,
});

const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: ["query"],
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma