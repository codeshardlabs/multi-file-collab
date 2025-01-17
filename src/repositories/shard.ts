import { FileInput, IShardRepository } from "../interfaces/repositories/shard";
import { File } from "../entities/file";
import { Shard, ShardWithFiles } from "../entities/shard";
import { ShardTableType } from "../db/tables/shards";
import { ShardDbType } from "../db";
import { and, eq, inArray, sql, SQL } from "drizzle-orm";
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
     
     async getFiles(id: number): Promise<File[]> {
        const files = await this.db.query.files.findMany({
            where: (files) => eq(files.shardId, id)
        });
         
         return files;
     }

     async getAllCollaborativeRooms(): Promise<Shard[]> {
        //  const roomsDoc = await this.model.find({ mode: "collaboration" });
        const rooms =  await this.db.query.shards.findMany({
           where: (shards) => eq(shards.mode, "collaboration")
         })

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

     // update multiple rows using (case/when) syntax: https://orm.drizzle.team/docs/guides/update-many-with-different-value
     async updateFiles(id: number, files: FileInput[] | FileInput): Promise<"OK" | null> {
        files = Array.isArray(files) ? files : [files];
        const sqlChunks : SQL[] = [];
        let names : string[] = [];
        sqlChunks.push(sql`(case`);
        for (const file of files) {
            sqlChunks.push(sql`when ${this.filesTable.name} = ${file.name} then ${file.code}`);
            names.push(file.name);
          }
          
        const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

        await this.db.update(this.filesTable).set({
            code: finalSql 
        }).where(and(
            eq(this.filesTable.shardId, id),
            inArray(this.filesTable.name, names)
        ))
         return null;
     }

     async getShardWithFiles(id: number): Promise<ShardWithFiles | null> {
       const shard =  await this.db.query.shards.findFirst({
            where : (shards) => eq(shards.id, id),
            with: {
                files: true
            }
        })

        if(!shard) return null;
        return shard;
     }
}