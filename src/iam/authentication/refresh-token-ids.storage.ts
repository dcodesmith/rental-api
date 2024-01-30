import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import Redis from 'ioredis';
import { createClient, VercelKV } from '@vercel/kv';

// 💡 Ideally this should be in a separate file - putting this here for brevity
export class InvalidatedRefreshTokenError extends Error {}

@Injectable()
export class RefreshTokenIdsStorage
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private redisClient: Redis | VercelKV;

  createClient() {
    return process.env.NODE_ENV === 'production'
      ? createClient({
          url: process.env.KV_REST_API_URL,
          token: process.env.KV_REST_API_TOKEN,
        })
      : new Redis({
          host: 'localhost', // NOTE: According to best practices, we should use the environment variables here instead.
          port: 6379, // 👆
        });
  }

  onApplicationBootstrap() {
    // TODO: Ideally, we should move this to the dedicated "RedisModule"
    // instead of initiating the connection here.

    this.redisClient = this.createClient();
  }

  onApplicationShutdown(signal?: string) {
    if (this.redisClient instanceof Redis) {
      return this.redisClient.quit();
    }
  }

  async insert(userId: number, tokenId: string) {
    await this.redisClient.set(this.getKey(userId), tokenId);
  }

  async validate(userId: number, tokenId: string) {
    const storedId = await this.redisClient.get(this.getKey(userId));

    if (storedId !== tokenId) {
      throw new InvalidatedRefreshTokenError();
    }

    return storedId === tokenId;
  }

  async invalidate(userId: number) {
    await this.redisClient.del(this.getKey(userId));
  }

  private getKey(userId: number) {
    return `user-${userId}`;
  }
}
