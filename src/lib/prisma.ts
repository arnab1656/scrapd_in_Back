import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Handle connection errors
prisma
  .$connect()
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((error: Error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
