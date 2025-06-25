import { PrismaClient } from '@prisma/client';

export class PrismaService {
  private static instance: PrismaService;
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
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
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Attempting to connect to database (attempt ${attempt}/${maxRetries})...`
        );
        await this.prisma.$connect();
        this.isConnected = true;
        console.log('✅ Successfully connected to database');
        return;
      } catch (error) {
        console.error(
          `❌ Database connection attempt ${attempt} failed:`,
          error
        );

        if (attempt === maxRetries) {
          console.error(
            '❌ Max retry attempts reached. Failed to connect to database.'
          );
          throw error;
        }

        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ Successfully disconnected from database');
    } catch (error) {
      console.error('❌ Failed to disconnect from database:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  public isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  // Method to reconnect if connection is lost
  public async reconnect(): Promise<void> {
    if (this.isConnected) {
      return; // Already connected
    }

    try {
      console.log('🔄 Attempting to reconnect to database...');
      await this.disconnect();
      await this.connect();
    } catch (error) {
      console.error('❌ Failed to reconnect to database:', error);
      throw error;
    }
  }
}

// Export a default instance for convenience
export const prisma = PrismaService.getInstance().getClient();
