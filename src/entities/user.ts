import { users } from "../db/tables/users";
import { Follower } from "./follower";

export type User = typeof users.$inferSelect;

export interface UserWithFollowersAndFollowering extends User {
  followers: Follower[];
  following: Follower[];
}
