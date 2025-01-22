import type { NextFunction, Request, Response } from "express";
import { shardRepo } from "../../db";
import { logger } from "../../services/logger/logger";
import { ShardPostRequestBody } from "../../routes/v1/types";
import { ShardTypeType } from "../../interfaces/repositories/shard";
import { AppError } from "../../errors";

export async function fetchShards(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  
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

export function fetchShardById(req: Request, res: Response) {
  // TODO: implement this
}

export function saveShard(req: Request, res: Response) {
  // TODO: implement this
}

export async function createShard(req: Request, res: Response) {
  const userId = req.user.id;
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

// ?type=""&title=""
export async function updateShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
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
      status: 200,
    });
  } catch (error) {
    logger.error("updateShard error", error);
    next(new AppError(500, "could not patch shard"));
  }
}

export function deleteShardById(req: Request, res: Response) {
  // TODO: implement this
}
