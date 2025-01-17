
import { File } from "../../entities/file";
import { Shard, ShardWithFiles } from "../../entities/shard";

export interface FileInput {
    code: string; 
    name: string;
}

export interface IShardRepository {
    findById: (id: number) => Promise<Shard | null>
    getFiles(id: number): Promise<File[]>
    updateLastSyncTimestamp(id: number): Promise<"OK" | null> 
    getAllCollaborativeRooms() : Promise<Shard[]>
    updateFiles(id: number, files: FileInput[] | FileInput): Promise<"OK" | null>
    getShardWithFiles(id: number): Promise<ShardWithFiles | null>
}