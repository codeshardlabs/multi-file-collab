import mongoose, { Model, Document } from "mongoose";
import {Shard} from "../entities/shard";
import { IShardRepository } from "../interfaces/IShardRepository";
import { Service } from "typedi";

export interface ShardDocument extends Omit<Shard, "id">, Document {
}

@Service("shard.repository")
 export default class ShardRepository implements IShardRepository {
    private model: Model<ShardDocument>
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