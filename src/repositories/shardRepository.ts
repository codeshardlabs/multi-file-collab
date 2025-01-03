import mongoose, { Model, Document } from "mongoose";
import {Shard} from "../entities/shard";
import { IShardRepository } from "../interfaces/IShardRepository";
import { File } from "../entities/file";


export interface ShardDocument extends Omit<Shard, "id">, Document {
}


 export default class ShardRepository implements IShardRepository {
     private model: Model<ShardDocument>;
    //  private static shardRepoInst: ShardRepository;
      constructor(model: Model<ShardDocument>) {
         this.model = model;
      }
     
    //  static getInstance(model: Model<ShardDocument>): ShardRepository {
    //      if (ShardRepository.shardRepoInst == null) {
    //          ShardRepository.shardRepoInst = new ShardRepository(model);
    //      }
    //      return ShardRepository.shardRepoInst;
    //  }

    async findById(id: string): Promise<Shard | null> {
        const doc = await this.model.findById(new mongoose.Types.ObjectId(id));
        return doc ? this.toEntity(doc) : null;
    }

    async save(doc: Shard): Promise<void> {
        const id = doc.id;
        const docWithoutId: Omit<Shard, "id"> = doc;
        await this.model.findByIdAndUpdate(id, {
           ...docWithoutId
        })
     }
     
     async getFiles(id: string): Promise<File[] | null> {
         const room = await this.findById(id);
         if (!room) return null;
         return room.files;
     }

     toEntity(doc: ShardDocument): Shard {
        return {
            id: doc._id as string,
            title: doc.title,
            creator: doc.creator,
            templateType: doc.templateType,
            files: doc.files,
            dependencies: doc.dependencies,
            type: doc.type,
            mode: doc.mode,
            likes: doc.likes, 
            likedBy: doc.likedBy,
            commentThread: doc.commentThread,
            lastSyncTime: doc?.lastSyncTime,
        }
    }
}