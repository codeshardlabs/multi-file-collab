import { and, eq, inArray, sql, SQL } from "drizzle-orm";
import { ShardDbType } from "../../../db";
import { shards } from "../../../db/tables/shards";
import { Shard, ShardWithFiles } from "../../../entities/shard";
import {
  CommentInput,
  FileInput,
  IShardRepository,
  PatchShardInput,
  ShardInput,
} from "../../../interfaces/repositories/db/shard";
import { logger } from "../../../services/logger/logger";
import { File } from "../../../entities/file";
import { files } from "../../../db/tables/files";
import { Comment } from "../../../entities/comment";
import { likes } from "../../../db/tables/likes";
import { comments } from "../../../db/tables/comments";

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

  async findByUserId(
    id: string,
    limit: number,
    offset: number,
  ): Promise<Shard[] | null> {
    try {
      const shards = await this.db.query.shards.findMany({
        where: (shards) => eq(shards.userId, id),
        limit: limit, // no. of rows to be limited to
        offset: offset, // no. of rows to skip
      });

      return shards;
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
      logger.debug("Unexpected error", error);
      return null;
    }
  }

  async insertFiles(id: number, fileInput: FileInput[]): Promise<"OK" | null> {
    try {
      await this.db.insert(files).values(fileInput);

      return "OK";
    } catch (error) {
      logger.debug("Unexpected error", error);
      return null;
    }
  }

  async getAllCollaborativeRooms(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Shard[] | null> {
    //  const roomsDoc = await this.model.find({ mode: "collaboration" });
    try {
      const rooms = await this.db.query.shards.findMany({
        where: (shards) =>
          and(eq(shards.mode, "collaboration"), eq(shards.userId, userId)),
        limit: limit,
        offset: offset,
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

  async getComments(
    id: number,
    limit: number,
    offset: number,
  ): Promise<Comment[] | null> {
    try {
      const comments = await this.db.query.comments.findMany({
        where: (comments) => eq(comments.shardId, id),
        limit: limit,
        offset: offset,
      });
      return comments;
    } catch (error) {
      logger.error(
        "shardRepository > getComments() error",
        error,
        "shardId",
        id,
      );
      return null;
    }
  }

  async like(shardId: number, userId: string): Promise<"OK" | null> {
    try {
      await this.db.insert(likes).values({
        shardId: shardId,
        likedBy: userId,
      });

      return "OK";
    } catch (error) {
      logger.error(
        "shardRepository > like()",
        "error",
        error,
        "shardId",
        shardId,
      );
      return null;
    }
  }

  async dislike(shardId: number, userId: string): Promise<"OK" | null> {
    try {
      await this.db
        .delete(likes)
        .where(and(eq(likes.shardId, shardId), eq(likes.likedBy, userId)));

      return "OK";
    } catch (error) {
      logger.error(
        "shardRepository > dislike()",
        "error",
        error,
        "shardId",
        shardId,
      );
      return null;
    }
  }

  async addComment(commentInput: CommentInput): Promise<Comment | null> {
    try {
      const out = await this.db
        .insert(comments)
        .values({
          message: commentInput.message,
          shardId: commentInput.shardId,
          userId: commentInput.userId,
        })
        .returning();

      return out[0];
    } catch (error) {
      logger.error(
        "shardRepository > addComment()",
        "error",
        error,
        "shardId",
        commentInput.shardId,
      );
      return null;
    }
  }

  async deleteComment(commentId: number): Promise<"OK" | null> {
    try {
      await this.db.delete(comments).where(eq(comments.id, commentId));

      return "OK";
    } catch (error) {
      logger.error(
        "shardRepository > deleteComment()",
        "error",
        error,
        "commentId",
        commentId,
      );
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
