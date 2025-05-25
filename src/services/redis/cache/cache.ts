import Redis, { ChainableCommander } from "ioredis";
import { RedisManager } from "../redisManager";
import { redisConfig } from "../../../config";
import CircuitBreaker from "./circuitBreaker";
import { ICacheService } from "../../../interfaces/services/cache";
import { logger } from "../../logger/logger";

export class CacheService implements ICacheService { 
    private client: Redis;
    private circuitBreaker: CircuitBreaker;
      constructor() {
      const redisManager = RedisManager.getInstance();
      this.client = redisManager.getConnection(redisConfig.connection.CONN_CACHE);
      this.circuitBreaker = new CircuitBreaker(5, 30000);
    }
      async get(key: string): Promise<string | null> {
      try {
       return await this.circuitBreaker.execute(this.client.get(key));
      } catch (error) {
        logger.error("Error getting key", error);
        return null;
      }
    }
  
    async set(key: string, value: string, ttl?: number): Promise<"OK" | null> {
      try {
        if (ttl) {
          return await this.circuitBreaker.execute(this.client.set(key, value, "EX", ttl));
        }
        return await this.circuitBreaker.execute(this.client.set(key, value));
      } catch (error) {
        logger.error("Error setting key", error);
        return null;
      }
      
    }
    async del(...keys: string[]): Promise<number> {
      try {
        return await this.circuitBreaker.execute(this.client.del(...keys));
      } catch (error) {
        logger.error("Error deleting keys", error);
        return 0;
      }
    }
  
    async keys(pattern: string): Promise<string[]> {
      try {
        return await this.circuitBreaker.execute(this.client.keys(pattern));
      } catch (error) {
        logger.error("Error getting keys", error);
        return [];
      }
    }

    pipeline(commands?: unknown[][]): ChainableCommander | null {
      try {
        return  this.client.pipeline(commands);
      } catch (error) {
        logger.error("Error creating pipeline", error);
        return null;
      }
    }
  }
  
export const cacheService = new CacheService();