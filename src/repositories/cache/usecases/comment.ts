import { Follower } from "../../../entities/follower";
import { UserWithFollowersAndFollowering } from "../../../entities/user";
import { ICommentRepository } from "../../../interfaces/repositories/cache/comment";
import { IKVService } from "../../../interfaces/services/redis";



export default class CommentRepository implements ICommentRepository {
 private cache: IKVService;
   private defaultTTL: number = 3000; // 3s
   private ttl: number;
   constructor(_cache: IKVService, ttl?: number) {
     this.cache = _cache;
     this.ttl = ttl ?? this.defaultTTL;
   }
 async getComments(id: number): Promise<Comment[] | null> {
     const key = this.getShardCommentsKey(id);
         const res = await this.cache.get(key);
         if (!res) return null;
         return JSON.parse(res) as Comment[];
 }

 private getShardCommentsKey(shardId: number): string {
    let shardKey = this.getShardKey(shardId);
    return `${shardKey}:comments`;
  }

  private getShardKey(shardId: number): string {
    return `shard:${shardId}`;
  }

}