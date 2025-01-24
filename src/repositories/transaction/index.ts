import { commentRepo, shardRepo, userRepo } from "../../db";
import { AppError } from "../../errors";
import { IRepository } from "../../interfaces/repositories";
import { ICommentRepository } from "../../interfaces/repositories/db/comment";
import { CommentInput, IShardRepository } from "../../interfaces/repositories/db/shard";
import { redisRepo } from "../cache/redis";
import { Transaction } from "./transaction";

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
        const tx = Transaction.begin();
     
        const commentInput : CommentInput = {
            message: comment.message,
            shardId: comment.shardId,
            userId: comment.userId
        }
        type deleteCommentPromiseAwaitedType = "OK" | null;
        type addCommentPromiseAwaitedType = "OK" | null;
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
    
}

export const txRepo = new TransactionRepository();


