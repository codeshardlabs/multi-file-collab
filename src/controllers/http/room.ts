import { NextFunction, Request, Response } from "express";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";
import { Shard, ShardWithFiles } from "../../entities/shard";
import { FileInput } from "../../interfaces/repositories/db/shard";
import httpRequestTimer from "../../prometheus/histogram";
import { db } from "../../repositories/db";
import { cache } from "../../repositories/cache";
import { NewRoomRequestBody } from "../../routes/v1/room";

export async function fetchLatestRoomFilesState(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.shard.id;
  let shard: ShardWithFiles;
  let start = Date.now();
  let source : "db" | "cache" = "db";
  try {
    let cachedShard = await cache.shard.getShardWithFiles(id);
    if (!cachedShard) {
      let dbShard = await db.shard.getShardWithFiles(id);
      if (!dbShard) {
        return next(new AppError(500, "Could not find resource by room ID"));
      }
      shard = dbShard;
      source = "db";
      let out = await cache.shard.saveShardWithFiles(id, dbShard);
      if (!out) {
        logger.warn("could not save shard with files to cache", "shardId", id);
      }
    } else {
      shard = cachedShard;
      source = "cache";
      let out = await db.shard.updateFiles(id, shard.files as FileInput[]);
      if (!out) {
        logger.warn("could not save updated files to db", "shardId", id);
      }
    }

    res.status(200).json({
      data: {
        shard,
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchLatestRoomFilesState() route error", error);
    next(new AppError(500, "could not fetch room files latest state info."));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function fetchAllRooms(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;
  let rooms: Shard[];
  let start = Date.now();
  let { limit, offset } = req.pagination;
  let source : "db" | "cache" = "db";
  try {
    let cachedRooms = await cache.shard.getAllCollaborativeRooms(userId);
    if (!cachedRooms) {
      const dbRooms = await db.shard.getAllCollaborativeRooms(
        userId,
        limit,
        offset,
      );
      if (!dbRooms) {
        return next(new AppError(500, "could not fetch rooms"));
      }
      rooms = dbRooms;
      source = "db";
      let out = await cache.shard.saveAllCollaborativeRooms(userId, dbRooms);
      if (!out) {
        logger.warn(
          "could not save collaborative rooms in shard",
          "userId",
          userId,
        );
      }
    } else {
      rooms = cachedRooms;
      source = "cache";
    }

    res.status(200).json({
      data: {
        rooms,
        source
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchAllRoom() route error", error);
    next(new AppError(500, "could not fetch collaborative rooms info."));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function createNewRoom(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.auth.user.id;
  const body = req.body as NewRoomRequestBody;
  try {
    
    const out = await db.shard.createNewRoom({
      title: "New Room",
      userId: userId,
        templateType: body.templateType,
        mode: "collaboration",
        type: "private"
    });
    if(!out || !out.shards || !out.files) {
      logger.error("db.shard.createNewRoom() returned null");
      return next(new AppError(500, "could not create new room"))
    }

    let {shards, files} = out;

    res.status(200).json({
      data: {
        shards, 
        files
      },
      error: null
    })

  } catch (error) {
    logger.error("room Repository error > createNewRoom()", error)
    next(new AppError(500, "could not create room"))
  }
}