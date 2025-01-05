import mongoose, { Model, Document } from "mongoose";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { User } from "../entities/user";



export interface UserDocument extends Omit<User, "id">, Document {
}


 export default class UserRepository implements IUserRepository {
     private model: Model<UserDocument>;
    //  private static shardRepoInst: ShardRepository;
      constructor(model: Model<UserDocument>) {
         this.model = model;
      }
     

    async findByUsername(username: string): Promise<User | null> {
        const doc = await this.model.findOne({ name: username });
        return doc ? this.toEntity(doc) : null;
    }

    async save(doc: User): Promise<void> {
        const id = doc.id;
        const docWithoutId: Omit<User, "id"> = doc;
        await this.model.findByIdAndUpdate(id, {
           ...docWithoutId
        })
     }
     
     toEntity(doc: UserDocument): User {
        return {
            id: doc._id as string,
            name: doc.name,
            email: doc.email,
            password: doc.password,
            followers: doc.followers,
            following: doc.following,
        }
    }
}