import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import * as Redis from 'ioredis';
import { ConfigType } from '@nestjs/config';
import redisConfig from './config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(redisConfig.KEY)
    private readonly redisConfiguration: ConfigType<typeof redisConfig>,
  ) {}
  public redisClient: Redis.Redis;

  onModuleInit() {
    const redisConfig = {
      host: this.redisConfiguration.host,
      port: this.redisConfiguration.port as unknown as number,
      username: this.redisConfiguration.username,
      password: this.redisConfiguration.password,
    };
     this.redisClient = new Redis.Redis(redisConfig);
  }
  onModuleDestroy() {
    this.redisClient.quit();
  }

  async set(key: string, value: any, ttl?: number): Promise<'OK'> {
    value = typeof value === 'object' ? JSON.stringify(value) : value;

    if (ttl && ttl > 0) {
      return this.redisClient.set(key, value, 'EX', ttl);
    }

    return this.redisClient.set(key, value);
  }

  async get(key: string): Promise<any> {
    const value = (await this.redisClient.get(key)) as any;
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redisClient.keys(pattern);
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.redisClient.exists(key);
  }

  async setex(key: string, ttl: number, value: any): Promise<void> {
    await this.redisClient.setex(key, ttl, value);
  }

  async hset(key: string, field: string, value: any): Promise<number> {
    value = typeof value === 'object' ? JSON.stringify(value) : value;
    return this.redisClient.hset(key, field, value);
  }

  async increment(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async hget(key: string, field: string): Promise<any> {
    const value = (await this.redisClient.hget(key, field)) as any;
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    const data = await this.redisClient.hgetall(key);
    const result = {};
    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value);
      } catch (e) {
        result[field] = value;
      }
    }
    return result;
  }
}
