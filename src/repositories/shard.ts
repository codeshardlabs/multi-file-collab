import { IShardRepository } from "../interfaces/repositories/IShardRepository";
import { File } from "../entities/file";
import { Shard } from "../entities/shard";
import { ShardTableType } from "../db/tables/shards";
import { ShardDbType } from "../db";
import { and, eq } from "drizzle-orm";
import { FilesTableType } from "../db/tables/files";


 export default class ShardRepository implements IShardRepository {
     private db: ShardDbType;
     private shardsTable : ShardTableType;
     private filesTable: FilesTableType;
      constructor(model: ShardDbType, _shardTable: ShardTableType, _filesTableType: FilesTableType) {
         this.db = model;
         this.shardsTable = _shardTable;
         this.filesTable =_filesTableType;
      }


    async findById(id: number): Promise<Shard | null> {
        const doc = await this.db.query.shards.findFirst({
            where: (shards) => eq(shards.id, id)
        });
        if(!doc) return null;
        return doc;
    }
     
     async getFiles(id: number): Promise<File[] | null> {
        const files = await this.db.query.files.findMany({
            where: (shards) => eq(shards.id, id)
        });
         if(!files) return null;
         return files;
     }

     async getAllCollaborativeRooms(): Promise<Shard[] | null> {
        //  const roomsDoc = await this.model.find({ mode: "collaboration" });
        const rooms =  await this.db.query.shards.findMany({
           where: (shards) => eq(shards.mode, "collaboration")
         })

         if(!rooms) return null;
         return rooms;
     }

     async getLastSyncTimestamp(id: number): Promise<Date | null> {
        //  const room = await this.model.findById(id, "lastSyncTimestamp");
        const shard = await this.db.query.shards.findFirst({
            where: (shards) => eq(shards.id, id),
            columns: {
                id: true,
                lastSyncTimestamp: true
            }
        })
        if(!shard) return null;
        return shard.lastSyncTimestamp;
     }

     async updateLastSyncTimestamp(id: number): Promise<"OK" | null> {
         const room = await this.db.update(this.shardsTable).set({
            lastSyncTimestamp : new Date(),
            updatedAt: new Date()
         }).where(eq(this.shardsTable.id, id)).returning();
         if(!room) return null;
         return "OK";
     }

     async updateFiles(id: number, filePath: string, code: string): Promise<"OK" | null> {
        await this.db.update(this.filesTable).set({
            code: code
        }).where(and(
            eq(this.filesTable.shardId, id),
            eq(this.filesTable.name, filePath)
        ))
         return null;
     }
}