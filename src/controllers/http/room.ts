import { NextFunction, Request, Response } from "express";
import { logger } from "../../services/logger/logger";
import { shardRepo } from "../../db";
import { AppError } from "../../errors";
import { Shard, ShardWithFiles } from "../../entities/shard";
import { redisRepo } from "../../repositories/cache/redis";
import { FileInput } from "../../interfaces/repositories/db/shard";
import httpRequestTimer from "../../prometheus/histogram";

export async function fetchLatestRoomFilesState(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.shard.id;
  let shard : ShardWithFiles;
  let start = Date.now();
  try {
    let cachedShard = await redisRepo.getShardWithFiles(id);
    if(!cachedShard) {
      let dbShard = await shardRepo.getShardWithFiles(id);
      if (!dbShard) {
        return next(new AppError(500, "Could not find resource by room ID"));
      }
      shard = dbShard;
      let out = await redisRepo.saveShardWithFiles(id, dbShard);
      if(!out) {
        logger.warn("could not save shard with files to cache", "shardId", id)
      }
    }
    else {
      shard = cachedShard;
      let out = await shardRepo.updateFiles(id, shard.files as FileInput[]);
      if(!out) {
        logger.warn("could not save updated files to db", "shardId", id)
      }
    }

    res.status(200).json({
      data: {
        shard
      },
      error: null
    })
  } catch (error) {
    logger.error("fetchLatestRoomFilesState() route error", error);
     next(new AppError(500, "could not fetch room files latest state info."));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer.labels(req.method, req.route.path, res.statusCode.toString()).observe(responseTimeInMs)
  }
}

export async function fetchAllRooms(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;
  let rooms : Shard[];
  let start = Date.now();
  try {
    let cachedRooms = await redisRepo.getAllCollaborativeRooms(userId);
    if(!cachedRooms) {
      const dbRooms = await shardRepo.getAllCollaborativeRooms(userId);
      if (!dbRooms) {
        return next(new AppError(500, "could not fetch rooms"));
      }
      rooms = dbRooms;
      let out = await redisRepo.saveAllCollaborativeRooms(userId, dbRooms);
      if(!out) {
        logger.warn("could not save collaborative rooms in shard", "userId", userId);
      }
    }
    else {
      rooms = cachedRooms;
    }

    res.status(200).json({
      data: {
        rooms,
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchAllRoom() route error", error);
     next(new AppError(500, "could not fetch collaborative rooms info."));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer.labels(req.method, req.route.path, res.statusCode.toString()).observe(responseTimeInMs)
  }
}
