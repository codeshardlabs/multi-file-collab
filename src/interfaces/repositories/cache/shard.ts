import { IRepository } from "..";
import { Comment } from "../../../entities/comment";
import { File } from "../../../entities/file";
import { Shard, ShardWithFiles } from "../../../entities/shard";
import { CommentInput, PatchShardInput } from "../db/shard";

export interface IShardRepository extends IRepository {
  findShardsByUserId(userId: string, page: number): Promise<Shard[] | null>;
  saveShardsByUserId(userId: string, shards: Shard[], page: number): Promise<"OK" | null>;
  getAllCollaborativeRooms(userId: string): Promise<Shard[] | null>;
  saveAllCollaborativeRooms(
    userId: string,
    shards: Shard[],
  ): Promise<"OK" | null>;
  getShardWithFiles(id: number): Promise<ShardWithFiles | null>;
  saveShardWithFiles(id: number, shard: ShardWithFiles): Promise<"OK" | null>;
 getFiles(shardId: number) : Promise<File[] | null>;
 saveFiles(shardId: number, files: File[]) : Promise<"OK" | null>;
  removeShardPages(userId: string): Promise<"OK" | null>;
  deleteShard(shardId: number, userId: string): Promise<"OK" | null>;
  patchShard(
      shardId: number,
      patchShardInput: PatchShardInput,
    ): Promise<"OK" | null> 
  addComment(
    shardId: number,
    commentInput: CommentInput,
    page: number
  ): Promise<Comment | null>;
  deleteComment(shardId: number, commentId: number, page: number): Promise<"OK" | null>;
  saveComments(id: number, comments: Comment[], page: number): Promise<"OK" | null>;
  getComments(id: number, page: number): Promise<Comment[] | null>;
  deleteAllComments(shardId: number): Promise<number>;
}
