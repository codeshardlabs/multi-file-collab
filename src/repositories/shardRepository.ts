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

     async getAllCollaborativeRooms(): Promise<Shard[] | null> {
         const roomsDoc = await this.model.find({ mode: "collaboration" }, "_id,lastSyncTimestamp");
         if (!roomsDoc) {
             return null;
         }

         let rooms : Shard[] = [];
      
         for (let room of roomsDoc) {
             rooms.push(this.toEntity(room));
         }
         return rooms;
     }

     async getLastSyncTimestamp(id: string): Promise<Date | null> {
         const room = await this.model.findById(id, "lastSyncTimestamp");
         if (!room) return null;
        return room.lastSyncTimestamp ?? null;
     }

     async updateLastSyncTimestamp(id: string): Promise<"OK" | null> {
         const room = await this.model.findById(id);
         if (!room) return null;
         room.lastSyncTimestamp = new Date();
         const ok = await room.save();
         if (!ok) return null;
         return "OK";
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
            lastSyncTimestamp: doc?.lastSyncTimestamp,
        }
    }
}