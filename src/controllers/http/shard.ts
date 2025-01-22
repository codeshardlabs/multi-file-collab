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
    const shard = await shardRepo.findById(id);
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
