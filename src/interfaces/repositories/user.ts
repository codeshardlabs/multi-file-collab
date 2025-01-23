import { Follower } from "../../entities/follower";
import { User } from "../../entities/user";

export interface UserInput {
  id: string;
}

export interface UserWithFollowersAndFollowering extends User {
  followers: Follower[],
  following: Follower[],
}

export interface IUserRepository {
  findById: (id: string) => Promise<User | null>;
  onboard: (userInput: UserInput) => Promise<User | null>;
  findByIdWithFollowersList(id: string): Promise<UserWithFollowersAndFollowering | null>;
  follow(followerId: string, followingId: string) : Promise<"OK" | null>;
  unfollow(followerId: string, followingId: string): Promise<"OK" | null>;
}
