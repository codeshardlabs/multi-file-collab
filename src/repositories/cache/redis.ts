import { Shard, ShardWithFiles } from "../../entities/shard";
import { User } from "../../entities/user";
import { IRedisRepository } from "../../interfaces/repositories/cache/redis";
import { UserWithFollowersAndFollowering } from "../../interfaces/repositories/db/user";
import { IKVService } from "../../interfaces/services/redis";
import { kvStore } from "../../services/redis/kvStore";



class RedisRepository implements IRedisRepository {
    private cache : IKVService;
    private defaultTTL : number = 60000; // 1minute
    private ttl: number;
    constructor(_cache: IKVService, ttl?: number) {
        this.cache = _cache;
        this.ttl = ttl ?? this.defaultTTL;
    }

   async getUserInfo(userId: string): Promise<UserWithFollowersAndFollowering | null> {
     const res = await this.cache.get(this.getUserKey(userId));
     if(!res) return null;
     return JSON.parse(res) as UserWithFollowersAndFollowering;
    }

    async saveUserInfo(user: UserWithFollowersAndFollowering): Promise<"OK" | null> {
            const key = this.getUserKey(user.id);
           return  await this.cache.set(key, JSON.stringify(user));
    }

    async findShardsByUserId(userId: string): Promise<Shard[] | null> {
        const key = this.getUserKey(userId);
        const res = await this.cache.get(key);
        if(!res) return null;
        return JSON.parse(res) as Shard[];
    }

    async saveShardsByUserId(userId: string, shards: Shard[]): Promise<"OK" | null> {
        const key = this.getUserKey(userId);
       return await this.cache.set(key, JSON.stringify(shards), this.ttl);
    }

    async getAllCollaborativeRooms(userId: string): Promise<Shard[] | null> {
        const key = this.getUserKey(userId);
        const res = await this.cache.get(key);
        if(!res) return null;
        return JSON.parse(res) as Shard[];
    }

    async saveAllCollaborativeRooms(userId: string, shards: Shard[]): Promise<"OK" | null> {
        const key = this.getUserKey(userId);
       return await this.cache.set(key, JSON.stringify(shards), this.ttl);
    }

    async getShardWithFiles(id: number): Promise<ShardWithFiles | null> {
        const key = this.getShardKey(id);
       const res =  await this.cache.get(key);
       if(!res) return null;
       return JSON.parse(res) as ShardWithFiles;
    }

    async saveShardWithFiles(id: number, shard: ShardWithFiles): Promise<"OK" | null> {
        const key = this.getShardKey(id);
        return await this.cache.set(key, JSON.stringify(shard), this.defaultTTL);
    }

    private getUserKey(userId: string) : string {
        return `user:${userId}`;
    }

    private getShardKey(shardId: number) : string {
        return `shard:${shardId}`;
    }

   

}

export const redisRepo = new RedisRepository(kvStore);