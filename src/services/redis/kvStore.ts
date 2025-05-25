import Redis, { Callback, ChainableCommander, RedisKey } from "ioredis";
import { RedisManager } from "./redisManager";
import { redisConfig } from "../../config";
import { IKVService } from "../../interfaces/services/redis";

// TODO add circuit breaker here
export class KVService implements IKVService { 
  private client: Redis;
    constructor() {
    const redisManager = RedisManager.getInstance();
    this.client = redisManager.getConnection(
      redisConfig.connection.CONN_KV_STORE,
    );
  }

  // get key from redis
  async get(key: string): Promise<string | null> {
    try {
     return await this.client.get(key);
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<"OK" | null> {
    try {
      if (ttl) {
        // if ttl > 0, set expiry date
        return await this.client.set(key, value, "EX", ttl);
      }
      // otherwise set without expiry data
      return await this.client.set(key, value);
    } catch (error) {
      return null;
    }
    
  }

  async hset(key: string, obj: object, cb?: Callback<number>): Promise<number> {
    return await this.client.hset(key, obj, cb);
  }

  // delete key from redis
  async del(...keys: string[]): Promise<number> {
    return await this.client.del(...keys);
  }

  // check if key exists or not
  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  // set TTL/expiry of key in seconds
  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds);
  }

  // append data to the redis list
  async rpush(key: RedisKey, data: string | number): Promise<number> {
    return await this.client.rpush(key, data);
  }

  // remove first k occurrence of element from list
  async lrem(
    key: RedisKey,
    k: number,
    element: string | number,
  ): Promise<number> {
    return await this.client.lrem(key, k, element);
  }

  // get length of the list
  async llen(key: RedisKey): Promise<number> {
    return await this.client.llen(key);
  }

  // buffers the content to the memory, before saving the contents on redis server.
  pipeline(commands?: unknown[][]): ChainableCommander {
    return  this.client.pipeline(commands);
  }

  multi(): ChainableCommander {
    return this.client.multi();
  }

  async zrangebyscore(
    key: RedisKey,
    min: number | string,
    max: number | string,
    cb?: Callback<string[]>,
  ): Promise<string[]> {
    if (cb) {
      return await this.client.zrangebyscore(key, min, max, cb);
    }
    return await this.client.zrangebyscore(key, min, max);
  }

  async hgetall(
    key: RedisKey,
    cb?: Callback<Record<string, string>>,
  ): Promise<Record<string, string>> {
    if (cb) {
      return await this.client.hgetall(key, cb);
    }
    return await this.client.hgetall(key);
  }
  async hget(
    key: RedisKey,
    field: string | Buffer,
    cb?: Callback<string | null>,
  ): Promise<string | null> {
    return await this.client.hget(key, field, cb);
  }

  async lrange(key: RedisKey, start: number, stop: number) : Promise<string[]> {
    return await this.client.lrange(key, start, stop)
  }

  async sadd(key: RedisKey, member: string | number): Promise<number> {
    return await this.client.sadd(key, member);
  }

  async srem(key: RedisKey, member: string | number): Promise<number> {
    return await this.client.srem(key, member);
  }
}

export const kvStore = new KVService();
