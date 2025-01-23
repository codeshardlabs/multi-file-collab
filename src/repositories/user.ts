import { IUserRepository, UserInput,UserWithFollowersAndFollowering } from "../interfaces/repositories/user";
import { User } from "../entities/user";
import { UserDbType } from "../db";
import { and, eq } from "drizzle-orm";
import { followers, users } from "../db/tables/users";
import { logger } from "../services/logger/logger";

export default class UserRepository implements IUserRepository {
  private db: UserDbType;
  constructor(model: UserDbType) {
    this.db = model;
  }
  async onboard(userInput: UserInput): Promise<User | null> {
    try {
      const res = await this.db.insert(users).values(userInput).returning();
      return res[0];
    } catch (error) {
      console.log("error occurred while creating users");
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

  async findByIdWithFollowersList(id: string): Promise<UserWithFollowersAndFollowering | null> {
    try {
      const doc = await this.db.query.users.findFirst({
        where: (users) => eq(users.id, id),
        with: {
          followers: true,
          following: true
        }
      });
      if (!doc) return null;
      return doc;
      
    } catch (error) {
      logger.error("shardRepository > findByIdWithFollowersList() error", error);
      return null;
    }
  }

  async follow(followerId: string, followingId: string): Promise<"OK" | null> {
    try {
      await this.db.insert(followers).values({
        followerId: followerId,
        followingId: followingId
      });
      return "OK";
    } catch (error) {
      return null;
    }
  }

  async unfollow(followerId: string, followingId: string): Promise<"OK" | null> {
    try {
      await this.db.delete(followers).where(and(
        eq(followers.followerId,followerId),
        eq(followers.followingId, followingId)
      ))
      return "OK";
    } catch (error) {
      return null;
    }
  }
}
