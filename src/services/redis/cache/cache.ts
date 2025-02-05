import Redis, { ChainableCommander } from "ioredis";
import { RedisManager } from "../redisManager";
import { redisConfig } from "../../../config";
import CircuitBreaker from "./circuitBreaker";
import { ICacheService } from "../../../interfaces/services/cache";

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
        return null;
      }
      
    }
      async del(...keys: string[]): Promise<number> {
      return await this.circuitBreaker.execute(this.client.del(...keys));
    }
  
    async keys(pattern: string): Promise<string[]> {
      return await this.circuitBreaker.execute(this.client.keys(pattern));
    }

    pipeline(commands?: unknown[][]): ChainableCommander {
        return  this.client.pipeline(commands);
      }
  }
  
export const cacheService = new CacheService();