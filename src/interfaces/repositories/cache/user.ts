import { IRepository } from "..";
import { Follower } from "../../../entities/follower";
import { UserWithFollowersAndFollowering } from "../../../entities/user";

export interface IUserRepository extends IRepository {
  getUserInfo(userId: string): Promise<UserWithFollowersAndFollowering | null>;
  saveUserInfo(user: UserWithFollowersAndFollowering): Promise<"OK" | null>;
  followUser(followerId: string, followingUser: Follower): Promise<"OK" | null>;
  unfollowUser(followerId: string): Promise<"OK" | null>;
}
