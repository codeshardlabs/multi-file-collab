import type { NextFunction, Request, Response } from "express";
import { shardRepo } from "../../db";
import { logger } from "../../services/logger/logger";
import {
  ShardModeType,
  ShardTemplateType,
  ShardTypeType,
} from "../../interfaces/repositories/shard";
import { AppError } from "../../errors";

export interface ShardPostRequestBody {
  templateType: ShardTemplateType;
  mode: ShardModeType;
  type: ShardTypeType;
}

export async function fetchShards(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;

  try {
    const shards = await shardRepo.findByUserId(userId);
    if (!shards) {
      return next(new AppError(500, "could not fetch shards by user id"));
    }

    res.status(200).json({
      data: {
        shards: shards,
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchShards() error", error);
    return next(new AppError(500, "could not fetch shards by user id"));
  }
}

export async function fetchShardById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.shard.id;
  try {
    const shard = await shardRepo.getShardWithFiles(id);
    if (!shard) return next(new AppError(400, "id does not exist"));
    res.status(200).json({
      error: null,
      data: {
        shard,
      },
    });
  } catch (error) {
    logger.error("fetchShardById() error", error);
    return next(new AppError(500, "could not fetch shard by id"));
  }
}

export function saveShard(req: Request, res: Response) {
  // TODO: implement this
}

export async function likeShard(req: Request, res: Response, next: NextFunction) {
  const shardId = req.shard.id;
  const userId = req.auth.user.id;
  try {
   const out =  await shardRepo.like(shardId, userId);
   if(!out) return next(new AppError(500, "could not like shard"));
   res.status(200).json({
    data: { 
      response : "OK"
    },
    error: null
   });
  } catch (error) {
    logger.debug("shardController > likeShard() error", error, "shardId", shardId);
    next(new AppError(500, `could not like shard for shard id: ${shardId}`));
  }}

  export async function dislikeShard(req: Request, res: Response, next: NextFunction) {
    const shardId = req.shard.id;
    const userId = req.auth.user.id;
    try {
     const out =  await shardRepo.dislike(shardId, userId);
     if(!out) return next(new AppError(500, "could not dislike shard"));
     res.status(200).json({
      data: { 
        response : "OK"
      },
      error: null
     });
    } catch (error) {
      logger.debug("shardController > dislikeShard() error", error, "shardId", shardId);
      next(new AppError(500, `could not dislike shard for shard id: ${shardId}`));
    }}
  

export async function getComments(req: Request, res: Response, next: NextFunction) {
  const shardId = req.shard.id;
  try {
   const comments =  await shardRepo.getComments(shardId);
   if(!comments) return next(new AppError(500, "could not get comments for shard"));
   res.status(200).json({
    data: { 
      comments
    },
    error: null
   });
  } catch (error) {
    logger.debug("shardController > getComments() error", error, "shardId", shardId);
    next(new AppError(500, `could not get comments for shard id: ${shardId}`));
  }
}

interface AddCommentRequestBody {
  message: string;
  shardId: number;
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  const body = req.body as AddCommentRequestBody;
  const userId = req.auth.user.id;
  try {
   const out =  await shardRepo.addComment({
    message: body.message,
    shardId: body.shardId,
    userId: userId
   });
   if(!out) return next(new AppError(500, "could not add comment to the shard"));
   res.status(200).json({
    data: { 
      response: "OK"
    },
    error: null
   });
  } catch (error) {
    logger.debug("shardController > addComment() error", error, "userId", userId);
    next(new AppError(500, `could not add comment for user id: ${userId}`));
  }
}


export async function createShard(req: Request, res: Response) {
  const userId = req.auth.user.id;
  const body = req.body as ShardPostRequestBody;
  // TODO: add validation
  try {
    await shardRepo.create({
      title: "Untitled",
      userId: userId,
      templateType: body.templateType,
      mode: body.mode,
      type: body.type,
    });
  } catch (error) {}
}

export async function updateShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;
  const query = req.query;
  const type = query.type ? (query.type as ShardTypeType) : "public";
  const title = query.title ? (query.title as string) : "";
  try {
    const out = await shardRepo.patch({
      type: type,
      userId: userId,
      title: title,
    });
    if (!out) next(new AppError(500, "could not patch shard"));

    res.status(200).json({
      error: null,
      data: {
        response: "OK",
      },
    });
  } catch (error) {
    logger.error("updateShard error", error);
    next(new AppError(500, "could not patch shard"));
  }
}

export async function deleteShardById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.shard.id;
    const out = await shardRepo.deleteById(id);
    if (!out) {
      return next(new AppError(500, "could not delte shard by id"));
    }
    res.status(200).json({
      error: null,
      data: {
        response: "OK",
      },
    });
  } catch (error) {
    logger.error("deleteShardById() error", error);
    next(new AppError(500, "could not delete shard by id"));
  }
}
