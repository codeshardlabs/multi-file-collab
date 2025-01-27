import { commentRepo, shardRepo, userRepo } from "../../db";
import { Comment } from "../../entities/comment";
import { Shard, ShardWithFiles } from "../../entities/shard";
import { AppError } from "../../errors";
import { IRepository } from "../../interfaces/repositories";
import { ICommentRepository } from "../../interfaces/repositories/db/comment";
import {
  CommentInput,
  PatchShardInput,
  ShardInput,
} from "../../interfaces/repositories/db/shard";
import { redisRepo } from "../cache/redis";
import { Transaction } from "./transaction";

type okAwaitedType = "OK" | null;

type repos = "shard" | "user" | "redis" | "comment";
class TransactionRepository {
  private mpp: Map<repos, IRepository> = new Map<repos, IRepository>();
  constructor() {
    this.mpp.set("shard", shardRepo);
    this.mpp.set("user", userRepo);
    this.mpp.set("redis", redisRepo);
    this.mpp.set("comment", commentRepo);
  }

  async deleteComment(commentId: number) {
    const comment = await (
      this.mpp.get("shard") as ICommentRepository
    ).getComment(commentId);
    if (!comment) throw new AppError(400, "not valid comment id");
    const commentInput: CommentInput = {
      message: comment.message,
      shardId: comment.shardId,
      userId: comment.userId,
    };
    const tx = Transaction.begin();
    type commentAwaitedType = Comment | null;
    tx.add<okAwaitedType, commentAwaitedType>(
      () => shardRepo.deleteComment(commentId), // execute
      () => shardRepo.addComment(commentInput), // rollback
    );

    tx.add<okAwaitedType, commentAwaitedType>(
      () => redisRepo.deleteComment(commentInput.shardId, commentId), // execute
      () => redisRepo.addComment(commentInput.shardId, commentInput), // rollback
    );

    await tx.exec();
  }

  async addComment(commentInput: CommentInput) {
    const tx = Transaction.begin();
    type commentAwaitedType = Comment | null;
    tx.add<commentAwaitedType, okAwaitedType>(
      () => shardRepo.addComment(commentInput), // execute
      (id: number) => shardRepo.deleteComment(id), // rollback
    );

    tx.add<commentAwaitedType, okAwaitedType>(
      () => redisRepo.addComment(commentInput.shardId, commentInput), // execute
      (id: number) => redisRepo.deleteComment(commentInput.shardId, id), // rollback
    );

    await tx.exec();
  }

  async updateShard(shardId: number, patchShardInput: PatchShardInput) {
    const shardDetails = await shardRepo.getShardWithFiles(shardId);
    if (!shardDetails) throw new Error("could not get shard details");
    const tx = Transaction.begin();

    tx.add<okAwaitedType, okAwaitedType>(
      () => shardRepo.patch(patchShardInput),
      () =>
        shardRepo.patch({
          // rollback
          type: shardDetails.type!,
          title: shardDetails.title!,
          userId: shardDetails.userId,
        }),
    );

    tx.add<okAwaitedType, okAwaitedType>(
      () => redisRepo.patchShard(shardId, patchShardInput),
      () =>
        redisRepo.patchShard(shardId, {
          type: shardDetails.type!,
          title: shardDetails.title!,
          userId: shardDetails.userId,
        }),
    );

    await tx.exec();
  }

  async deleteShard(shardId: number) {
    const shardWithFiles = await shardRepo.getShardWithFiles(shardId);
    if (!shardWithFiles)
      throw new AppError(400, "could not find shard by shard id");
    const shard: Omit<ShardWithFiles, "files"> = shardWithFiles;
    const tx = Transaction.begin();
    tx.add<okAwaitedType, Shard[] | null>(
      () => shardRepo.deleteById(shardId),
      () =>
        shardRepo.create({
          ...(shard as ShardInput),
        }),
    );

    tx.add<okAwaitedType, okAwaitedType>(
      () => redisRepo.deleteShard(shardId),
      () => redisRepo.saveShardWithFiles(shardId, shardWithFiles),
    );

    await tx.exec();
  }
}

export const txRepo = new TransactionRepository();
