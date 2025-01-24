import { Shard, ShardWithFiles } from "../../../entities/shard";
import { UserWithFollowersAndFollowering } from "../db/user";

export interface IRedisRepository {
    getUserInfo(userId: string): Promise<UserWithFollowersAndFollowering | null>
    saveUserInfo(user: UserWithFollowersAndFollowering): Promise<"OK" | null>
    findShardsByUserId(userId: string): Promise<Shard[] | null>
    saveShardsByUserId(userId: string, shards: Shard[]): Promise<"OK" | null>
    getAllCollaborativeRooms(userId: string): Promise<Shard[] | null>
    saveAllCollaborativeRooms(userId: string, shards: Shard[]): Promise<"OK" | null>
    getShardWithFiles(id: number): Promise<ShardWithFiles | null>
    saveShardWithFiles(id: number, shard: ShardWithFiles): Promise<"OK" | null>
}