import { NextFunction, Request, Response } from "express";
import { shardRepo } from "../../db";
import { AppError } from "../../errors";
import { logger } from "../../services/logger/logger";

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  const commentId = req.comment.id;
  try {
   const out =  await shardRepo.deleteComment(commentId);
   if(!out) return next(new AppError(500, "could not delete comment"));
   res.status(200).json({
    data: { 
      response: "OK"
    },
    error: null
   });
  } catch (error) {
    logger.debug("commentController > addComment() error", error);
    next(new AppError(500, `could not delete comment for comment id ${commentId}`));
  }
}