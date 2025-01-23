import {
  FileInput,
  IShardRepository,
  PatchShardInput,
  ShardInput,
} from "../interfaces/repositories/shard";
import { File } from "../entities/file";
import { Shard, ShardWithFiles } from "../entities/shard";
import { shards } from "../db/tables/shards";
import { ShardDbType } from "../db";
import { and, eq, inArray, sql, SQL } from "drizzle-orm";
import { files } from "../db/tables/files";
import { logger } from "../services/logger/logger";

export default class ShardRepository implements IShardRepository {
  private db: ShardDbType;
  constructor(model: ShardDbType) {
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

  async findByUserId(id: string): Promise<Shard[] | null> {
    try {
      const users = await this.db.query.shards.findMany({
        where: (shards) => eq(shards.userId, id),
      });

      return users;
    } catch (error) {
      logger.error("shard repository find by user id error", error);
      return null;
    }
  }

  async getFiles(id: number): Promise<File[] | null> {
    try {
      const files = await this.db.query.files.findMany({
        where: (files) => eq(files.shardId, id),
      });
      
      return files;
    } catch (error) {
      logger.debug("Unexpected error", error)
      return null;
    }

  }

  async getAllCollaborativeRooms(userId: string): Promise<Shard[] | null> {
    //  const roomsDoc = await this.model.find({ mode: "collaboration" });
    try {
      const rooms = await this.db.query.shards.findMany({
        where: (shards) =>
          and(eq(shards.mode, "collaboration"), eq(shards.userId, userId)),
      });

      return rooms;
    } catch (error) {
      logger.warn("shard repository getAllCollaborativeRooms() error");
      return null;
    }
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
    fileInput: FileInput[] | FileInput,
  ): Promise<"OK" | null> {
    fileInput = Array.isArray(fileInput) ? fileInput : [fileInput];
    const sqlChunks: SQL[] = [];
    let names: string[] = [];
    sqlChunks.push(sql`(case`);
    for (const file of fileInput) {
      sqlChunks.push(sql`when ${file.name} = ${file.name} then ${file.code}`);
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
        .where(and(eq(files.shardId, id), inArray(files.name, names)));
      return "OK";
    } catch (error) {
      console.log("error updating files");
      return null;
    }
  }

  async patch(patchShardInput: PatchShardInput): Promise<"OK" | null> {
    try {
      // TODO: implement this
      let updatedInput: Partial<PatchShardInput> = {
        type: patchShardInput.type,
      };

      if (patchShardInput.title) {
        updatedInput["title"] = patchShardInput.title;
      }

      const res = await this.db
        .update(shards)
        .set(updatedInput)
        .where(eq(shards.userId, patchShardInput.userId))
        .returning();

      if (!res) {
        throw new Error("could not update shard");
      }
      return "OK";
    } catch (error) {
      logger.error("shard repository patchShard error", error);
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

  async deleteById(id: number): Promise<"OK" | null> {
    try {
      await this.db.delete(shards).where(eq(shards.id, id));
      return "OK";
    } catch (error) {
      logger.error("shard repository > deleteById() error", error);
      return null;
    }
  }
}
