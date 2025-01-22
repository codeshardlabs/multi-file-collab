import { IUserRepository, UserInput } from "../interfaces/repositories/user";
import { User } from "../entities/user";
import { UserDbType } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../db/tables/users";

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
}
