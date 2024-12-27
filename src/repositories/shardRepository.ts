import { Shard } from "../entities/shard";
import { IShardRepository } from "../interfaces/IShardRepository";
import { Shard as ShardModel } from "../models/shard";


export default class ShardRepository implements IShardRepository {
    constructor() {

    }
    async findById(id: string): Promise<unknown> {
    return await ShardModel.findById(id);
    }

}