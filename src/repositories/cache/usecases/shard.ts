import { Comment } from "../../../entities/comment";
import { File } from "../../../entities/file";
import { Shard, ShardWithFiles } from "../../../entities/shard";
import { IShardRepository } from "../../../interfaces/repositories/cache/shard";
import { CommentInput, PatchShardInput } from "../../../interfaces/repositories/db/shard";
import { IKVService } from "../../../interfaces/services/redis";
import { logger } from "../../../services/logger/logger";
import { getUserKey } from "../utils";



export default class ShardRepository implements IShardRepository {
 private cache: IKVService;
   private defaultTTL: number = 3000; // 3s
   private ttl: number;
   constructor(_cache: IKVService, ttl?: number) {
     this.cache = _cache;
     this.ttl = ttl ?? this.defaultTTL;
   }

   
     async findShardsByUserId(userId: string): Promise<Shard[] | null> {
       const key = getUserKey(userId);
       const res = await this.cache.get(key);
       if (!res) return null;
       return JSON.parse(res) as Shard[];
     }
   
     async saveShardsByUserId(
       userId: string,
       shards: Shard[],
     ): Promise<"OK" | null> {
       const key = getUserKey(userId);
       return await this.cache.set(key, JSON.stringify(shards), this.ttl);
     }
   
     async addShard(userId: string, shard: Shard): Promise<"OK" | null> {
       const key = getUserKey(userId);
       const shards = await this.findShardsByUserId(userId);
       if (!shards) return null;
       shards.push(shard);
       return await this.saveShardsByUserId(userId, shards);
     }
   
     async getAllCollaborativeRooms(userId: string): Promise<Shard[] | null> {
       const key = getUserKey(userId);
       const res = await this.cache.get(key);
       if (!res) return null;
       return JSON.parse(res) as Shard[];
     }
   
     async saveAllCollaborativeRooms(
       userId: string,
       shards: Shard[],
     ): Promise<"OK" | null> {
       const key = getUserKey(userId);
       return await this.cache.set(key, JSON.stringify(shards), this.ttl);
     }
   
     async getShardWithFiles(id: number): Promise<ShardWithFiles | null> {
       const key = this.getShardKey(id);
       const res = await this.cache.get(key);
       if (!res) return null;
   
       const shard = JSON.parse(res) as ShardWithFiles;
       if (shard.mode === "collaboration") {
         const shardWithFilesKeyPattern = `${key}:file:*`;
         const keys = await this.cache.keys(shardWithFilesKeyPattern);
         let files: File[] = [];
         const pipeline = this.cache.pipeline();
         for (let key of keys) {
           pipeline.get(key);
         }
   
         const res = await pipeline.exec();
         if (!res) {
           logger.warn(
             "redisRepository > getShardWithFiles() pipeline execution error",
           );
           return null;
         }
         for (let record of res!) {
           if (record[0] !== null) {
             logger.warn("redisRepository > getShardWithFiles() error", record[0]);
             return null;
           }
           let temp = record[1] as string;
           let file = JSON.parse(temp) as File;
           files.push(file);
         }
         shard.files = files;
       }
       return shard;
     }
   
     async saveShardWithFiles(
       id: number,
       shard: ShardWithFiles,
     ): Promise<"OK" | null> {
       const key = this.getShardKey(id);
       return await this.cache.set(key, JSON.stringify(shard), this.defaultTTL);
     }
   
     async getComments(id: number): Promise<Comment[] | null> {
       const key = this.getShardCommentsKey(id);
       const res = await this.cache.get(key);
       if (!res) return null;
       return JSON.parse(res) as Comment[];
     }
   
     async saveComments(id: number, comments: Comment[]): Promise<"OK" | null> {
       const key = this.getShardCommentsKey(id);
       return await this.cache.set(key, JSON.stringify(comments), this.ttl);
     }
   
     async addComment(
       shardId: number,
       commentInput: CommentInput,
     ): Promise<Comment | null> {
       const comments = await this.getComments(shardId);
       if (!comments) {
         logger.warn("could not get comments", "shardId", shardId);
         return null;
       }
       comments.push(commentInput as Comment);
       let out = await this.saveComments(shardId, comments);
       if (!out) return null;
       return commentInput as Comment;
     }
   
     async deleteAllComments(shardId: number): Promise<number> {
       return await this.cache.del(this.getShardCommentsKey(shardId));
     }
   
     async deleteComment(
       shardId: number,
       commentId: number,
     ): Promise<"OK" | null> {
       const comments = await this.getComments(shardId);
       if (!comments) return null;
       // Reference: https://stackoverflow.com/a/5767357
       const index = comments.findIndex((comment) => comment.id === commentId);
       if (index !== -1) {
         comments.splice(index, 1);
         return await this.saveComments(shardId, comments);
       }
   
       return "OK";
     }
   
     async patchShard(
       shardId: number,
       patchShardInput: PatchShardInput,
     ): Promise<"OK" | null> {
       try {
         let key = this.getShardKey(shardId);
         const out = await this.cache.get(key);
         if (!out) return null;
         let shard = JSON.parse(out) as ShardWithFiles;
         shard.type = patchShardInput.type;
         if (patchShardInput.title) shard.title = patchShardInput.title;
         return await this.saveShardWithFiles(shardId, shard);
       } catch (error) {
         logger.error("redis repository patchShard error", error);
         return null;
       }
     }
   
     async deleteShard(shardId: number): Promise<"OK" | null> {
       let key = this.getShardKey(shardId);
       let num = await this.cache.del(key);
       if (num === 0) {
         logger.error("could not delete shard", {
           source: "cache",
           key: key,
           shardId: shardId,
         });
         return null;
       }
       return "OK";
     }
   
     



 private getShardCommentsKey(shardId: number): string {
    let shardKey = this.getShardKey(shardId);
    return `${shardKey}:comments`;
  }


  private getShardKey(shardId: number): string {
    return `shard:${shardId}`;
  }

}