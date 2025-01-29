import { Follower } from "../../../entities/follower";
import { UserWithFollowersAndFollowering } from "../../../entities/user";
import { ICommentRepository } from "../../../interfaces/repositories/cache/comment";
import { IKVService } from "../../../interfaces/services/redis";
import { getCommentKey } from "../utils";

export default class CommentRepository implements ICommentRepository {
  private cache: IKVService;
  private defaultTTL: number = 3000; // 3s
  private ttl: number;
  constructor(_cache: IKVService, ttl?: number) {
    this.cache = _cache;
    this.ttl = ttl ?? this.defaultTTL;
  }

  async getComment(id: number): Promise<Comment | null> {
    let out = await this.cache.get(getCommentKey(id));
    if (!out) return null;

    return JSON.parse(out) as Comment;
  }
}
