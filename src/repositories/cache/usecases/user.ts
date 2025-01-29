import { Follower } from "../../../entities/follower";
import { UserWithFollowersAndFollowering } from "../../../entities/user";
import { IUserRepository } from "../../../interfaces/repositories/cache/user";
import { IKVService } from "../../../interfaces/services/redis";


export default class UserRepository implements IUserRepository {
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

  async followUser(
    followerId: string,
    followingUser: Follower,
  ): Promise<"OK" | null> {
    const user = await this.getUserInfo(followerId);
    if (!user) return null;

    user.following.push(followingUser);
    return await this.saveUserInfo(user);
  }

  async unfollowUser(
    followerId: string
  ): Promise<"OK" | null> {
    const user = await this.getUserInfo(followerId);
    if (!user) return null;

    const ind = user.following.find((temp) => temp.followingId === temp.followingId);
    
    return await this.saveUserInfo(user);
  }

  private getUserKey(userId: string): string {
    return `user:${userId}`;
  }

}