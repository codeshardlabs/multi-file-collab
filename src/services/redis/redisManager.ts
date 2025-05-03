import Redis from "ioredis";
import { redisConfig } from "../../config";

export class RedisManager {
  private static redisManagerInst: RedisManager;
  private pool: Map<string, Redis> = new Map();
  private constructor() {}

  static getInstance(): RedisManager {
    if (RedisManager.redisManagerInst == null) {
      RedisManager.redisManagerInst = new RedisManager();
    }
    return RedisManager.redisManagerInst;
  }

  // checks if there is existing connection or not by connection name, and if not create new connection and add it to the pool
  getConnection(name: string = redisConfig.connection.CONN_DEFAULT): Redis {
    if (!this.pool.has(name)) {
      const connection = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
        password: process.env.REDIS_PASSWORD!
      });
      this.pool.set(name, connection);
    }
    return this.pool.get(name)!;
  }

  // close all connections and delete the corresponding values from the in-memory map
  async closeAll(): Promise<void> {
    for (const [name, connection] of this.pool.entries()) {
      await connection.quit();
      this.pool.delete(name);
    }
  }
}
