
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { User } from "../entities/user";
import { UserDbType } from "../db";
import { UserTableType } from "../db/tables/users";
import { eq } from "drizzle-orm";




 export default class UserRepository implements IUserRepository {
     private db: UserDbType;
     private table : UserTableType;
    //  private static shardRepoInst: ShardRepository;
      constructor(model: UserDbType, _table: UserTableType ) {
         this.db = model;
         this.table = _table;
      }
     

    async findById(id: string): Promise<User | null> {
         const doc = await this.db.query.users.findFirst({
                    where: (users) => eq(users.id, id)
                });
        if(!doc) return null;
        return doc;
    }

    
}