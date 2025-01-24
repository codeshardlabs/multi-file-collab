import { ChainableCommander, RedisKey } from "ioredis";

export interface IKVService {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<"OK">;
    hset(key: string, obj: object, cb?: Callback<number>): Promise<number>;
    del(...keys: string[]): Promise<number>;
    exists(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    expire(key: string, seconds: number): Promise<number>;
    rpush(key: RedisKey, data: string | number): Promise<number>;
    lrem(key: RedisKey, k: number, element: string | number): Promise<number>;
    llen(key: RedisKey): Promise<number>;
    pipeline(commands?: unknown[][]): ChainableCommander;
    multi(): ChainableCommander;
    zrangebyscore(
      key: RedisKey,
      min: number | string,
      max: number | string,
      cb?: Callback<string[]>
    ): Promise<string[]>;
    hgetall(
      key: RedisKey,
      cb?: Callback<Record<string, string>>
    ): Promise<Record<string, string>>;
    hget(
      key: RedisKey,
      field: string | Buffer,
      cb?: Callback<string | null>
    ): Promise<string | null>;
  }
  
  export type Callback<T> = (err?: Error | null, res?: T) => void;
  