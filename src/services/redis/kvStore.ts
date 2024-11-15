import Redis from "ioredis";
import { RedisManager } from "./redisManager";
import { redisConfig } from "../../config";


export class KVService {
    private client: Redis;
    constructor() {
        const redisManager = RedisManager.getInstance();
        this.client = redisManager.getConnection(redisConfig.connection.CONN_KV_STORE);
    }

    // get key from redis
    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
      }
    
      async set(key: string, value: string, ttl?: number): Promise<'OK'> {
          if (ttl) {
            // if ttl > 0, set expiry date
          return await this.client.set(key, value, 'EX', ttl);
          }
          // otherwise set without expiry data
        return await this.client.set(key, value);
      }
    
    // delete key from redis
      async del(...keys : string[]): Promise<number> {
        return await this.client.del(...keys);
  }
  
  // check if key exists or not
      async exists(key: string): Promise<number> {
         return await this.client.exists(key)
       }
  
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
      }
    
    // set TTL/expiry of key in seconds
      async expire(key: string, seconds: number): Promise<number> {
        return await this.client.expire(key, seconds);
      }
}