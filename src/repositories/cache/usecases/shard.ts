import { Comment } from "../../../entities/comment";
import { File } from "../../../entities/file";
import { Shard, ShardWithFiles } from "../../../entities/shard";
import { IShardRepository } from "../../../interfaces/repositories/cache/shard";
import {
  CommentInput,
  PatchShardInput,
} from "../../../interfaces/repositories/db/shard";
import { ICacheService } from "../../../interfaces/services/cache";
import { logger } from "../../../services/logger/logger";
import { getShardKey, getShardsByUserIdKey, getUserKey } from "../utils";

export default class ShardRepository implements IShardRepository {
  private cache: ICacheService;
  private defaultTTL: number = 60000; // 1min
  private ttl: number;
  constructor(_cache: ICacheService, ttl?: number) {
    this.cache = _cache;
    this.ttl = ttl ?? this.defaultTTL;
  }

  async findShardsByUserId(userId: string, page: number): Promise<Shard[] | null> {
    const key =getShardsByUserIdKey(userId, page);
    // key : `user:{userId}:shards:page:{page}`
    const res = await this.cache.get(key);
    if (!res) return null;
    return JSON.parse(res) as Shard[];
  }

  async saveShardsByUserId(
    userId: string,
    shards: Shard[],
    page: number
  ): Promise<"OK" | null> {
    const key = getShardsByUserIdKey(userId, page);
    return await this.cache.set(key, JSON.stringify(shards), this.ttl);
  }

  async removeShardPages(userId: string): Promise<"OK" | null> {
    let pattern = `${getUserKey(userId)}:shards:page:*`;
    const keys = await this.cache.keys(pattern);
    let count = await this.cache.del(...keys);
    if(keys.length !== count) {
      logger.debug(`could not delete ${keys.length - count} keys from cache`, {
        userId: userId,
        source: "cacheRepository"
      })
      return null;
    }
    return "OK";
  }

  async removeCommentPages(shardId: number): Promise<"OK" | null> {
    let pattern = `${this.getShardCommentsKey(shardId)}:page:*`;
    const keys = await this.cache.keys(pattern);
    let count = await this.cache.del(...keys);
    if(keys.length !== count) {
      logger.debug(`could not delete ${keys.length - count} keys from cache`, {
        shardId: shardId,
        source: "cacheRepository>removeCommentPages(shardId)"
      })
      return null;
    }
    return "OK";
  }

  async getAllCollaborativeRooms(userId: string): Promise<Shard[] | null> {
    const key = getUserKey(userId);
    const res = await this.cache.get(key);
    if (!res) return null;
    return JSON.parse(res) as Shard[];
  }

  async getFiles(shardId: number) : Promise<File[] | null> {
    const key = `${getShardKey(shardId)}:files`;
    let out = await this.cache.get(key);
    if(!out) return null;
    return JSON.parse(out) as File[];
  }
  async saveFiles(shardId: number, files: File[]) : Promise<"OK" | null> {
    const key = `${getShardKey(shardId)}:files`;
    return await this.cache.set(key, JSON.stringify(files), this.ttl);
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
    return await this.cache.set(key, JSON.stringify(shard), this.ttl);
  }

  async getComments(id: number, page: number): Promise<Comment[] | null> {
    const key = `${this.getShardCommentsKey(id)}:page:${page}`;
    
    const res = await this.cache.get(key);
    if (!res) return null;
    return JSON.parse(res) as Comment[];
  }

  async saveComments(id: number, comments: Comment[], page: number): Promise<"OK" | null> {
    const key = `${this.getShardCommentsKey(id)}:page:${page}`;
        return await this.cache.set(key, JSON.stringify(comments), this.ttl);
  }

  async addComment(
    shardId: number,
    commentInput: CommentInput,
    page: number
  ): Promise<Comment | null> {
    const comments = await this.getComments(shardId, page);
    if (!comments) {
      logger.warn("could not get comments", "shardId", shardId);
      return null;
    }
    comments.push(commentInput as Comment);
    let out = await this.saveComments(shardId, comments, page);
    if (!out) return null;
    return commentInput as Comment;
  }

  async deleteAllComments(shardId: number): Promise<number> {
    return await this.cache.del(this.getShardCommentsKey(shardId));
  }

  async deleteComment(
    shardId: number,
    commentId: number,
    page: number
  ): Promise<"OK" | null> {
    const comments = await this.getComments(shardId, page);
    if (!comments) return null;
    // Reference: https://stackoverflow.com/a/5767357
    const index = comments.findIndex((comment) => comment.id === commentId);
    if (index !== -1) {
      comments.splice(index, 1);
      return await this.saveComments(shardId, comments, page);
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
      await this.removeShardPages(patchShardInput.userId);
      return await this.saveShardWithFiles(shardId, shard);
    } catch (error) {
      logger.error("redis repository patchShard error", error);
      return null;
    }
  }

  async deleteShard(shardId: number, userId: string): Promise<"OK" | null> {
    let key = this.getShardKey(shardId);
    let num = await this.cache.del(key);
    await this.removeShardPages(userId);
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
