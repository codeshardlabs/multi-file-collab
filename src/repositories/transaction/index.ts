import { commentRepo, shardRepo, userRepo } from "../../db";
import { Comment } from "../../entities/comment";
import { AppError } from "../../errors";
import { IRepository } from "../../interfaces/repositories";
import { ICommentRepository } from "../../interfaces/repositories/db/comment";
import { CommentInput, PatchShardInput } from "../../interfaces/repositories/db/shard";
import { redisRepo } from "../cache/redis";
import { Transaction } from "./transaction";

      type deleteCommentPromiseAwaitedType = "OK" | null;
      type addCommentPromiseAwaitedType = Comment | null;
      

type repos = "shard" | "user" | "redis" | "comment";
class TransactionRepository {
    private mpp : Map<repos,IRepository> = new Map<repos, IRepository>();
    constructor() {
        this.mpp.set("shard", shardRepo);
        this.mpp.set("user", userRepo);
        this.mpp.set("redis", redisRepo);
        this.mpp.set("comment", commentRepo);
    }

    async deleteComment(commentId: number) {
        const comment =  await (this.mpp.get("shard") as ICommentRepository).getComment(commentId)
        if(!comment) throw new AppError(400, "not valid comment id")
            const commentInput : CommentInput = {
                message: comment.message,
                shardId: comment.shardId,
                userId: comment.userId
            }
        const tx = Transaction.begin();
     
   
         tx.add<deleteCommentPromiseAwaitedType, addCommentPromiseAwaitedType>(
          () => shardRepo.deleteComment(commentId),// execute 
          () => shardRepo.addComment(commentInput)// rollback
        );
      
         tx.add<deleteCommentPromiseAwaitedType, addCommentPromiseAwaitedType>(
          () => redisRepo.deleteComment(commentInput.shardId, commentId),// execute 
          () => redisRepo.addComment(commentInput.shardId, commentInput)// rollback 
         )
      
         await tx.exec();
    }

    async addComment(commentInput: CommentInput) {
        const tx = Transaction.begin();

         tx.add<addCommentPromiseAwaitedType, deleteCommentPromiseAwaitedType>(
          () => shardRepo.addComment(commentInput),// execute 
          (id: number) => shardRepo.deleteComment(id)// rollback
        );
      
         tx.add<addCommentPromiseAwaitedType, deleteCommentPromiseAwaitedType>(
          () => redisRepo.addComment(commentInput.shardId, commentInput),// execute 
          (id: number) => redisRepo.deleteComment(commentInput.shardId, id)// rollback 
         )
      
         await tx.exec();
    }

    async updateShard(shardId: number, patchShardInput: PatchShardInput) {
        const shardDetails = await shardRepo.getShardWithFiles(shardId);
        if(!shardDetails) throw new Error("could not get shard details");
        type updateShardPromiseAwaitedType = "OK" | null;
        const tx = Transaction.begin();

         tx.add<updateShardPromiseAwaitedType, updateShardPromiseAwaitedType>(
            () => shardRepo.patch(patchShardInput),
            () => shardRepo.patch({ // rollback
                type: shardDetails.type!,
                title: shardDetails.title!,
                userId: shardDetails.userId
            })
        );
      
         tx.add<updateShardPromiseAwaitedType, updateShardPromiseAwaitedType>(
            () => redisRepo.patchShard(shardId, patchShardInput),
            () => redisRepo.patchShard(shardId, {
                type: shardDetails.type!,
                title: shardDetails.title!,
                userId: shardDetails.userId
            })
         )
      
         await tx.exec();
    }
    
}

export const txRepo = new TransactionRepository();


