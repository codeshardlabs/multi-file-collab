import {
  FileInput,
  IShardRepository,
  ShardInput,
} from "../interfaces/repositories/shard";
import { File } from "../entities/file";
import { Shard, ShardWithFiles } from "../entities/shard";
import { shards, ShardTableType } from "../db/tables/shards";
import { ShardDbType } from "../db";
import { and, eq, inArray, sql, SQL } from "drizzle-orm";
import { files, FilesTableType } from "../db/tables/files";

export default class ShardRepository implements IShardRepository {
  private db: ShardDbType;
  constructor(
    model: ShardDbType,
  ) {
    this.db = model;
  }

  async create(shardInput: ShardInput[] | ShardInput): Promise<Shard[] | null> {
    shardInput = Array.isArray(shardInput) ? shardInput : [shardInput];
    try {
      return await this.db.insert(shards).values(shardInput).returning();
    } catch (error) {
      console.log("error occurred while creating shards");
      return null;
    }
  }

  async findById(id: number): Promise<Shard | null> {
    const doc = await this.db.query.shards.findFirst({
      where: (shards) => eq(shards.id, id),
    });
    if (!doc) return null;
    return doc;
  }

  async getFiles(id: number): Promise<File[]> {
    const files = await this.db.query.files.findMany({
      where: (files) => eq(files.shardId, id),
    });

    return files;
  }

  async getAllCollaborativeRooms(): Promise<Shard[]> {
    //  const roomsDoc = await this.model.find({ mode: "collaboration" });
    const rooms = await this.db.query.shards.findMany({
      where: (shards) => eq(shards.mode, "collaboration"),
    });

    return rooms;
  }

  async getLastSyncTimestamp(id: number): Promise<Date | null> {
    //  const room = await this.model.findById(id, "lastSyncTimestamp");
    const shard = await this.db.query.shards.findFirst({
      where: (shards) => eq(shards.id, id),
      columns: {
        id: true,
        lastSyncTimestamp: true,
      },
    });
    if (!shard) return null;
    return shard.lastSyncTimestamp;
  }

  async updateLastSyncTimestamp(id: number): Promise<"OK" | null> {
    const room = await this.db
      .update(shards)
      .set({
        lastSyncTimestamp: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shards.id, id))
      .returning();
    if (!room) return null;
    return "OK";
  }

  // update multiple rows using (case/when) syntax: https://orm.drizzle.team/docs/guides/update-many-with-different-value
  async updateFiles(
    id: number,
    fileInput:  FileInput[] | FileInput,
  ): Promise<"OK" | null> {
    fileInput = Array.isArray(fileInput) ? fileInput : [fileInput];
    const sqlChunks: SQL[] = [];
    let names: string[] = [];
    sqlChunks.push(sql`(case`);
    for (const file of fileInput) {
      sqlChunks.push(
        sql`when ${file.name} = ${file.name} then ${file.code}`,
      );
      names.push(file.name);
    }
    sqlChunks.push(sql`end)`);
    const finalSql: SQL = sql.join(sqlChunks, sql.raw(" "));
    try {
      await this.db
        .update(files)
        .set({
          code: finalSql,
        })
        .where(
          and(
            eq(files.shardId, id),
            inArray(files.name, names),
          ),
        );
      return "OK";
    } catch (error) {
      console.log("error updating files");
      return null;
    }
  }

  async getShardWithFiles(id: number): Promise<ShardWithFiles | null> {
    const shard = await this.db.query.shards.findFirst({
      where: (shards) => eq(shards.id, id),
      with: {
        files: true,
      },
    });
    console.log(shard);
    if (!shard) return null;
    return shard;
  }
}
