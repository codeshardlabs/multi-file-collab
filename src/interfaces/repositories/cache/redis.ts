import { IRepository } from "..";
import { Comment } from "../../../entities/comment";
import { Shard, ShardWithFiles } from "../../../entities/shard";
import { CommentInput } from "../db/shard";
import { UserWithFollowersAndFollowering } from "../db/user";

export interface IRedisRepository extends IRepository {
    getUserInfo(userId: string): Promise<UserWithFollowersAndFollowering | null>
    saveUserInfo(user: UserWithFollowersAndFollowering): Promise<"OK" | null>
    findShardsByUserId(userId: string): Promise<Shard[] | null>
    saveShardsByUserId(userId: string, shards: Shard[]): Promise<"OK" | null>
    getAllCollaborativeRooms(userId: string): Promise<Shard[] | null>
    saveAllCollaborativeRooms(userId: string, shards: Shard[]): Promise<"OK" | null>
    getShardWithFiles(id: number): Promise<ShardWithFiles | null>
    saveShardWithFiles(id: number, shard: ShardWithFiles): Promise<"OK" | null>
    getComments(id: number) : Promise<Comment[] | null>
    saveComments(id: number, comments: Comment[]) : Promise<"OK" | null>
    deleteComment(shardId: number, commentId: number): Promise<"OK" | null>
    addComment(shardId: number, commentInput: CommentInput): Promise<Comment | null>
    deleteAllComments(shardId: number) : Promise<number>
}