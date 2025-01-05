
import { File } from "../../entities/file";
import { Shard } from "../../entities/shard";

export interface IShardRepository {
    findById: (id: string) => Promise<Shard | null>
    save(doc: Shard): Promise<void> 
    getFiles(id: string): Promise<File[] | null>
    updateLastSyncTimestamp(id: string): Promise<"OK" | null> 
    getAllCollaborativeRooms() : Promise<Shard[] | null>
}