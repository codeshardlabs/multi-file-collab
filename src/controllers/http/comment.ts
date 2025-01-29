import { NextFunction, Request, Response } from "express";
import { AppError } from "../../errors";
import { logger } from "../../services/logger/logger";
import httpRequestTimer from "../../prometheus/histogram";
import { db } from "../../repositories/db";
import { cache } from "../../repositories/cache";

interface DeleteCommentRequestBody {
  shardId: number;
}
export async function deleteComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const commentId = req.comment.id;
  const body = req.body as DeleteCommentRequestBody;
  let start = Date.now();
  try {
    let out = await db.shard.deleteComment(commentId);
    if(!out) {
       next(new AppError(500, `could not delete comment: ${commentId}`));
    }
     else {
      // comment deleted
      let out = await cache.shard.removeCommentPages(body.shardId);
      if(!out) {
        logger.warn("could not remove comments pages", {
          commentId: commentId,
          shardId: body.shardId,
        })
        res.status(200).json({
          data: {
            response: "OK",
          },
          error: null,
        });
      }
     }
  } catch (error) {
    logger.debug("commentController > addComment() error", error);
    next(
      new AppError(500, `could not delete comment for comment id ${commentId}`),
    );
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}
