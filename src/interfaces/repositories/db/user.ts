import { IRepository } from "..";
import { User, UserWithFollowersAndFollowering } from "../../../entities/user";

export interface UserInput {
  id: string;
}

export interface IUserRepository extends IRepository {
  findById: (id: string) => Promise<User | null>;
  onboard: (userInput: UserInput) => Promise<User | null>;
  findByIdWithFollowersList(
    id: string,
  ): Promise<UserWithFollowersAndFollowering | null>;
  follow(followerId: string, followingId: string): Promise<"OK" | null>;
  unfollow(followerId: string, followingId: string): Promise<"OK" | null>;
}
