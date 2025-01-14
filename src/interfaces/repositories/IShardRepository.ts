
import { File } from "../../entities/file";
import { Shard } from "../../entities/shard";

export interface IShardRepository {
    findById: (id: number) => Promise<Shard | null>
    getFiles(id: number): Promise<File[] | null>
    updateLastSyncTimestamp(id: number): Promise<"OK" | null> 
    getAllCollaborativeRooms() : Promise<Shard[] | null>
}