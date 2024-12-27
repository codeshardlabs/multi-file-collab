import { Model, Document } from "mongoose";
import { Shard } from "../entities/shard";
import { IShardRepository } from "../interfaces/IShardRepository";
import { Shard as ShardModel } from "../models/shard";

interface ShardDocument extends Omit<Shard, "id">, Document {
}

export default class ShardRepository implements IShardRepository {
    private model: Model<ShardDocument>
    constructor(model: Model<ShardDocument>) {
        this.model = model;
    }

    async findById(id: string): Promise<Shard | null> {
        const doc = await this.model.findById(id);
        if (!doc) return null;
        return this.toEntity(doc);
    }

    private toEntity(doc: ShardDocument): Shard {
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
            lastSyncTime: doc.lastSyncTime,
        }
    }
}