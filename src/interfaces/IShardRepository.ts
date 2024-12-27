import { Shard } from "../entities/shard";


export interface IShardRepository {
    findById: (id: string) => Promise<Shard | null>
}