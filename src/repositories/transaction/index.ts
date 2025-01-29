import { Comment } from "../../entities/comment";
import { Shard, ShardWithFiles } from "../../entities/shard";
import { AppError } from "../../errors";
import {
  CommentInput,
  PatchShardInput,
  ShardInput,
} from "../../interfaces/repositories/db/shard";
import { cache } from "../cache";
import { db } from "../db";
import { Transaction } from "./transaction";

type okAwaitedType = "OK" | null;

type repos = "shard" | "user" | "redis" | "comment";
class TransactionRepository {
  async deleteComment(commentId: number) {
    const comment = await db.comment.getComment(commentId);
    if (!comment) throw new AppError(400, "not valid comment id");
    const commentInput: CommentInput = {
      message: comment.message,
      shardId: comment.shardId,
      userId: comment.userId,
    };
    const tx = Transaction.begin();
    type commentAwaitedType = Comment | null;
    tx.add<okAwaitedType, commentAwaitedType>(
      () => db.shard.deleteComment(commentId), // execute
      () => db.shard.addComment(commentInput), // rollback
    );

    tx.add<okAwaitedType, commentAwaitedType>(
      () => cache.shard.deleteComment(commentInput.shardId, commentId), // execute
      () => cache.shard.addComment(commentInput.shardId, commentInput), // rollback
    );

    await tx.exec();
  }

  async addComment(commentInput: CommentInput) {
    const tx = Transaction.begin();
    type commentAwaitedType = Comment | null;
    tx.add<commentAwaitedType, okAwaitedType>(
      () => db.shard.addComment(commentInput), // execute
      (id: number) => db.shard.deleteComment(id), // rollback
    );

    tx.add<commentAwaitedType, okAwaitedType>(
      () => cache.shard.addComment(commentInput.shardId, commentInput), // execute
      (id: number) => cache.shard.deleteComment(commentInput.shardId, id), // rollback
    );

    await tx.exec();
  }

  async updateShard(shardId: number, patchShardInput: PatchShardInput) {
    const shardDetails = await db.shard.getShardWithFiles(shardId);
    if (!shardDetails) throw new Error("could not get shard details");
    const tx = Transaction.begin();

    tx.add<okAwaitedType, okAwaitedType>(
      () => db.shard.patch(patchShardInput),
      () =>
        db.shard.patch({
          // rollback
          type: shardDetails.type!,
          title: shardDetails.title!,
          userId: shardDetails.userId,
        }),
    );

    tx.add<okAwaitedType, okAwaitedType>(
      () => cache.shard.patchShard(shardId, patchShardInput),
      () =>
        cache.shard.patchShard(shardId, {
          type: shardDetails.type!,
          title: shardDetails.title!,
          userId: shardDetails.userId,
        }),
    );

    await tx.exec();
  }

  async deleteShard(shardId: number) {
    const shardWithFiles = await db.shard.getShardWithFiles(shardId);
    if (!shardWithFiles)
      throw new AppError(400, "could not find shard by shard id");
    const shard: Omit<ShardWithFiles, "files"> = shardWithFiles;
    const tx = Transaction.begin();
    tx.add<okAwaitedType, Shard[] | null>(
      () => db.shard.deleteById(shardId),
      () =>
        db.shard.create({
          ...(shard as ShardInput),
        }),
    );

    tx.add<okAwaitedType, okAwaitedType>(
      () => cache.shard.deleteShard(shardId),
      () => cache.shard.saveShardWithFiles(shardId, shardWithFiles),
    );

    await tx.exec();
  }
}

export const txRepo = new TransactionRepository();
