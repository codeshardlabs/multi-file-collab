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
      async delete(key: string): Promise<number> {
        return await this.client.del(key);
      }
  
    
    // set TTL/expiry of key in seconds
      async expire(key: string, seconds: number): Promise<number> {
        return await this.client.expire(key, seconds);
      }
}