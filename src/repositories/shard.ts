import { IShardRepository } from "../interfaces/repositories/IShardRepository";
import { File } from "../entities/file";
import { Shard } from "../entities/shard";
import { ShardTableType } from "../db/tables/shards";
import { ShardDbType } from "../db";
import { eq } from "drizzle-orm";


 export default class ShardRepository implements IShardRepository {
     private db: ShardDbType;
     private table : ShardTableType;
    //  private static shardRepoInst: ShardRepository;
      constructor(model: ShardDbType, _table: ShardTableType) {
         this.db = model;
         this.table = _table;
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
         const room = await this.db.update(this.table).set({
            lastSyncTimestamp : new Date(),
            updatedAt: new Date()
         }).where(eq(this.table.id, id)).returning();
         if(!room) return null;
         return "OK";
     }
}