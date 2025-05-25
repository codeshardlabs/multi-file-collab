import { and, eq } from "drizzle-orm";
import { UserDbType } from "../../../db";
import { followers, users } from "../../../db/tables";
import { User, UserWithFollowersAndFollowering } from "../../../entities/user";
import {
  IUserRepository,
  UserInput,
} from "../../../interfaces/repositories/db/user";
import { logger } from "../../../services/logger/logger";

export default class UserRepository implements IUserRepository {
  private db: UserDbType;
  constructor(model: UserDbType) {
    this.db = model;
  }
  async onboard(userInput: UserInput): Promise<User | null> {
    try {

     const existingUser = await this.findById(userInput.id);
     // SIGNIN case
     if (existingUser) return existingUser;
     // SIGNUP case
      const res = await this.db.insert(users).values(userInput).returning();
      return res[0];
    } catch (error) {
      console.log("error occurred while creating users", error);
      return null;
    }
  }
  async findById(id: string): Promise<User | null> {
    const doc = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, id),
    });
    if (!doc) return null;
    return doc;
  }

  async findByIdWithFollowersList(
    id: string,
  ): Promise<UserWithFollowersAndFollowering | null> {
    try {
      const doc : any = await this.db.query.users.findFirst({
        where: (users) => eq(users.id, id),
        with: {
          shards: true
        }
      });

      const followers = await this.db.query.followers.findMany({
        where: (followers) => eq(followers.followerId, id),
      });
      const following = await this.db.query.followers.findMany({
        where: (followers) => eq(followers.followingId, id),
      });

      doc.followers = followers.map((follower) => follower.followingId);
      doc.following = following.map((following) => following.followerId);
      if (!doc) return null;
      return doc;
    } catch (error) {
      logger.error(
        "shardRepository > findByIdWithFollowersList() error",
        error,
      );
      return null;
    }
  }

  async follow(followerId: string, followingId: string): Promise<"OK" | null> {
    try {
      const existingFollower = await this.db.query.followers.findFirst({
        where: (followers) => eq(followers.followerId, followerId),
      });
      if (existingFollower) return "OK"; //already followed
      await this.db.insert(followers).values({
        followerId: followerId,
        followingId: followingId,
      });
      return "OK";
    } catch (error) {
      return null;
    }
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<"OK" | null> {
    try {
      const existingFollower = await this.db.query.followers.findFirst({
        where: (followers) => eq(followers.followerId, followerId),
      });
      if (!existingFollower) return "OK"; //already unfollowed`
      await this.db
        .delete(followers)
        .where(
          and(
            eq(followers.followerId, followerId),
            eq(followers.followingId, followingId),
          ),
        );
      return "OK";
    } catch (error) {
      return null;
    }
  }
}
