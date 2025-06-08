import { ChainableCommander } from "ioredis";


export interface ICacheService {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<"OK" | null>;
    del(...keys: string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    smembers(key: string): Promise<string[]>;
    pipeline(commands?: unknown[][]): ChainableCommander | null;
}