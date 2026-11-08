import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    console.log('DEBUG: Connecting to DB URL:', process.env.DATABASE_URL);
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL as string,
        },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'colorless',
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async enableShutdownHooks(app: any) {
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }

  // Helper method for safe transactions
  async executeTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }

  // Helper method for cursor-based pagination
  getCursorPagination(cursor?: string, limit = 20) {
    const take = Math.min(limit, 100); // Maximum 100 items
    const skip = cursor ? 1 : 0;
    
    return {
      take,
      skip,
      cursor: cursor ? { id: cursor } : undefined,
    };
  }

  // Helper method to convert BigInt IDs to strings for JSON serialization
  serializeBigIntIds<T extends Record<string, any>>(data: T | T[]): T | T[] {
    if (Array.isArray(data)) {
      return data.map(item => this.serializeBigIntIds(item)) as T[];
    }

    if (data && typeof data === 'object') {
      const serialized = { ...data } as Record<string, any>;
      for (const key in serialized) {
        if (typeof serialized[key] === 'bigint') {
          serialized[key] = serialized[key].toString();
        } else if (serialized[key] && typeof serialized[key] === 'object') {
          serialized[key] = this.serializeBigIntIds(serialized[key]);
        }
      }
      return serialized as T;
    }

    return data;
  }
}