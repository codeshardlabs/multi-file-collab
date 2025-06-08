import { and, eq, inArray, sql, SQL } from "drizzle-orm";
import { ShardDbType } from "../../../db";
import { comments, shards, files, replies, likes, roomMembers } from "../../../db/tables";
import { Shard, ShardWithFiles } from "../../../entities/shard";
import {
  CommentInput,
  FileInput,
  IShardRepository,
  NewRoomOutput,
  PatchShardInput,
  ShardInput,
} from "../../../interfaces/repositories/db/shard";
import { logger } from "../../../services/logger/logger";
import { File } from "../../../entities/file";
import { Comment } from "../../../entities/comment";
import { SANDBOX_TEMPLATES } from "../../../templates";
import { formatFilesLikeInDb } from "../../../utils";
import { RoomMemberRoleType } from "../../../interfaces/repositories/db/shard";
import { env } from "../../../config";
import { GenericResponse } from "../../../interfaces/repositories";

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
      console.log("error occurred while creating shards", error);
      return null;
    }
  }

  async createNewRoom(shardInput: ShardInput): Promise<NewRoomOutput | null> {
    let shardOutput : Shard[] = [];
    let fileOutput : File[] = [];
    try {
      await this.db.transaction(async (tx) => {
          shardOutput = await tx.insert(shards).values(shardInput).returning();
          const roomId =  shardOutput[0].id;
          const templateType = shardOutput[0].templateType!;
         
            fileOutput = await tx.insert(files).values(formatFilesLikeInDb(SANDBOX_TEMPLATES[templateType].files, roomId)).returning();
      })
      return {
        shards: shardOutput,
        files: fileOutput
      }
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
        where: (shards) => and(
          eq(shards.userId, id), 
          eq(shards.mode, "normal")
        ),
        limit: limit, // no. of rows to be limited to
        offset: offset, //in no. of rows to skip
        with: {
          files: true,
          dependencies: true,
          likes: true
        }
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
      return [];
    }
  }

  async insertFiles(id: number, fileInput: FileInput[]): Promise<"OK" | null> {
    try {
      const mappedFiles = fileInput.map((file) => ({
        code: file.code,
        name: file.name,
        shardId: id,
      } as File));
       await this.db.insert(files).values(mappedFiles);
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
        with: {
          files: true
        }
      });

      return rooms;
    } catch (error) {
      logger.warn("shard repository getAllCollaborativeRooms() error", error);
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

    const filesToUpdate = fileInput.map((file) => ({
      code: file.code,
      name: file.name,
      shardId: id,
    } as File));

    try {
      await this.db.transaction(async (tx) => {
        for (const file of filesToUpdate) {
          await tx.update(files)
            .set({
              code: file.code,
              updatedAt: new Date()
            })
            .where(and(eq(files.shardId, id), eq(files.name, file.name!)));
        }
      });
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
  ): Promise<[] | null> {
    try {
      // const comments = await this.db.query.comments.findMany({
      //   where: (comments) => eq(comments.shardId, id),
      //   limit: limit,
      //   offset: offset,
      //   with: {
      //     replies: true
      //   }
      // });
      // return comments;

      // TODO prevent sql injection attacks
      const cmnts: any = await this.db.execute(sql`
        SELECT 
          comments.*,
          COUNT(replies.id) as "replyCount"
        FROM comments
        LEFT JOIN replies ON replies.parent_id = comments.id 
        WHERE comments.shard_id = ${id}
        GROUP BY comments.id
        LIMIT ${limit}
        OFFSET ${offset}
      `);
      if(cmnts?.rows && cmnts?.rows.length > 0) {
        return cmnts.rows;
      }
      return [];
    } catch (error) {
      logger.error(
        "shardRepository > getComments() error",
        error,
        "shardId",
        id,
      );
      return [];
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

      let out = await this.db
        .insert(comments)
        .values({
          message: commentInput.message,
          shardId: commentInput.shardId,
          userId: commentInput.userId,
        })        
        .returning();

      return out?.[0] || null;
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

  async editComment(commentId: number, content: string): Promise<"OK" | null> {
    try {
      await this.db.update(comments).set({ message: content }).where(eq(comments.id, commentId));
      return "OK";
    } catch (error) {
      logger.error("shard repository > editComment() error", error);
      return null;
    }
  }

  async patch(patchShardInput: PatchShardInput): Promise<"OK" | null> {
    try {
      // TODO: implement this
      let updatedInput: Partial<PatchShardInput> = {};
      if(patchShardInput.type) {
        updatedInput["type"] = patchShardInput.type;
      }

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

  async inviteToRoom(roomId: number, userId: string, role: RoomMemberRoleType): Promise<GenericResponse> {
    try {
      const room = await this.db.query.shards.findFirst({
        where: (shards) => eq(shards.id, roomId),
      });
      if(!room) {
        throw new Error("room not found");
      }

      const existingMember = await this.db.query.roomMembers.findFirst({
        where: (roomMembers) => and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)),
      });
      if(existingMember) {
        throw new Error("user already a member of the room");
      }

      const usersInRoom = await this.db.query.roomMembers.findMany({
        where: (roomMembers) => eq(roomMembers.roomId, roomId),
      });
      if(usersInRoom.length >= 5) {
        throw new Error("room is full");
      }

      const ownerAlreadyPresent = usersInRoom?.find((user) => user.role === "owner");
      if(ownerAlreadyPresent && role === "owner") {
        throw new Error("There can only be one owner in one room.")
      }

      await this.db.insert(roomMembers).values({
        roomId: roomId,
        userId: userId,
        role: role,
      });
      return {
        data: "Invitation sent successfully",
        error: null
      }
    } catch (error) {
      logger.error("shard repository > inviteToRoom() error", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Could not invite to room"
      };
    }
  }

  async getRoomMembers(roomId: number): Promise<GenericResponse> {
    try {
      const members = await this.db.query.roomMembers.findMany({
        where: (roomMembers) => eq(roomMembers.roomId, roomId),
      });
      return {
        data: members,
        error: null
      }
    } catch (error) {
      logger.error("shard repository > getRoomMembers() error", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Could not fetch room members"
      };
    }
  }
}


