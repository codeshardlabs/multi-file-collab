import { Comment } from "../../entities/comment";
import { File } from "../../entities/file";
import { Follower } from "../../entities/follower";
import { Shard, ShardWithFiles } from "../../entities/shard";
import { IRedisRepository } from "../../interfaces/repositories/cache/redis";
import {
  CommentInput,
  PatchShardInput,
} from "../../interfaces/repositories/db/shard";
import { UserWithFollowersAndFollowering } from "../../interfaces/repositories/db/user";
import { IKVService } from "../../interfaces/services/redis";
import { logger } from "../../services/logger/logger";
import { kvStore } from "../../services/redis/kvStore";

class RedisRepository implements IRedisRepository {
  private cache: IKVService;
  private defaultTTL: number = 3000; // 3s
  private ttl: number;
  constructor(_cache: IKVService, ttl?: number) {
    this.cache = _cache;
    this.ttl = ttl ?? this.defaultTTL;
  }

  async getUserInfo(
    userId: string,
  ): Promise<UserWithFollowersAndFollowering | null> {
    const res = await this.cache.get(this.getUserKey(userId));
    if (!res) return null;
    return JSON.parse(res) as UserWithFollowersAndFollowering;
  }

  async saveUserInfo(
    user: UserWithFollowersAndFollowering,
  ): Promise<"OK" | null> {
    const key = this.getUserKey(user.id);
    return await this.cache.set(key, JSON.stringify(user));
  }

  async findShardsByUserId(userId: string): Promise<Shard[] | null> {
    const key = this.getUserKey(userId);
    const res = await this.cache.get(key);
    if (!res) return null;
    return JSON.parse(res) as Shard[];
  }

  async saveShardsByUserId(
    userId: string,
    shards: Shard[],
  ): Promise<"OK" | null> {
    const key = this.getUserKey(userId);
    return await this.cache.set(key, JSON.stringify(shards), this.ttl);
  }

  async addShard(userId: string, shard: Shard): Promise<"OK" | null> {
    const key = this.getUserKey(userId);
    const shards = await this.findShardsByUserId(userId);
    if (!shards) return null;
    shards.push(shard);
    return await this.saveShardsByUserId(userId, shards);
  }

  async getAllCollaborativeRooms(userId: string): Promise<Shard[] | null> {
    const key = this.getUserKey(userId);
    const res = await this.cache.get(key);
    if (!res) return null;
    return JSON.parse(res) as Shard[];
  }

  async saveAllCollaborativeRooms(
    userId: string,
    shards: Shard[],
  ): Promise<"OK" | null> {
    const key = this.getUserKey(userId);
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
    let out = await redisRepo.saveComments(shardId, comments);
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

  async followUser(
    followerId: string,
    followingUser: Follower,
  ): Promise<"OK" | null> {
    const user = await this.getUserInfo(followerId);
    if (!user) return null;

    user.following.push(followingUser);
    return await this.saveUserInfo(user);
  }

  private getUserKey(userId: string): string {
    return `user:${userId}`;
  }

  private getShardCommentsKey(shardId: number): string {
    let shardKey = this.getShardKey(shardId);
    return `${shardKey}:comments`;
  }

  private getShardKey(shardId: number): string {
    return `shard:${shardId}`;
  }
}

export const redisRepo = new RedisRepository(kvStore);
