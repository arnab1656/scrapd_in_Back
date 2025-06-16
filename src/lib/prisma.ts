import { PrismaClient } from "@prisma/client";

export class PrismaService {
  private static instance: PrismaService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log("Successfully connected to database");
    } catch (error) {
      console.error("Failed to connect to database:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log("Successfully disconnected from database");
    } catch (error) {
      console.error("Failed to disconnect from database:", error);
      throw error;
    }
  }
}

// Export a default instance for convenience
export const prisma = PrismaService.getInstance().getClient();
