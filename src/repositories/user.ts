import { IUserRepository } from "../interfaces/repositories/user";
import { User } from "../entities/user";
import { UserDbType } from "../db";
import { UserTableType } from "../db/tables/users";
import { eq } from "drizzle-orm";

export default class UserRepository implements IUserRepository {
  private db: UserDbType;
  //  private static shardRepoInst: ShardRepository;
  constructor(model: UserDbType) {
    this.db = model;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, id),
    });
    if (!doc) return null;
    return doc;
  }
}
