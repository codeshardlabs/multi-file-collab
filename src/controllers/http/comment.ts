import { NextFunction, Request, Response } from "express";
import { AppError } from "../../errors";
import { logger } from "../../services/logger/logger";
import { txRepo } from "../../repositories/transaction";
import httpRequestTimer from "../../prometheus/histogram";


interface DeleteCommentRequestBody {
  shardId: number;
}
export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  const commentId = req.comment.id;
  const body = req.body as DeleteCommentRequestBody;
  let start = Date.now();
  try {
     await txRepo.deleteComment(commentId);
   res.status(200).json({
    data: { 
      response: "OK"
    },
    error: null
   });
  } catch (error) {
    logger.debug("commentController > addComment() error", error);
    next(new AppError(500, `could not delete comment for comment id ${commentId}`));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer.labels(req.method, req.route.path, res.statusCode.toString()).observe(responseTimeInMs)

  }
}