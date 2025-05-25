import { NextFunction, Request, Response } from "express";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";
import { Shard, ShardWithFiles } from "../../entities/shard";
import { FileInput } from "../../interfaces/repositories/db/shard";
import httpRequestTimer from "../../prometheus/histogram";
import { db } from "../../repositories/db";
import { cache } from "../../repositories/cache";
import { NewRoomRequestBody } from "../../routes/v1/room";
import { DataSource } from "../../constants/global.constants";

export async function fetchLatestRoomFilesState(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.shard.id;
  let shard: ShardWithFiles;
  let src = "";
  try {
    let cachedShard = await cache.shard.getShardWithFiles(id);
    if (!cachedShard) {
      let dbShard = await db.shard.getShardWithFiles(id);
      if (!dbShard) {
        return next(new AppError(500, "Could not find resource by room ID"));
      }
      shard = dbShard;
      src = DataSource.DB;
      let out = await cache.shard.saveShardWithFiles(id, dbShard);
      if (!out) {
        logger.warn("could not save shard with files to cache", "shardId", id);
      }
    } else {
      shard = cachedShard;
      src = DataSource.CACHE;
      // let out = await db.shard.updateFiles(id, shard.files as FileInput[]);
      // if (!out) {
      //   logger.warn("could not save updated files to db", "shardId", id);
      // }
    }

    res.status(200).json({
      data: {
        shard,
        src : src ?? undefined
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchLatestRoomFilesState() route error", error);
    next(new AppError(500, "could not fetch room files latest state info."));
  } 
}

export async function fetchAllRooms(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;
  let rooms: Shard[];
  let { limit, offset } = req.pagination;
  let src = "";
  try {
    // let cachedRooms = await cache.shard.getAllCollaborativeRooms(userId);
    let cachedRooms = null;
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
      src = DataSource.DB;
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
      src = DataSource.CACHE;
    }

    res.status(200).json({
      data: {
        rooms,
        src : src ?? undefined
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchAllRoom() route error", error);
    next(new AppError(500, "could not fetch collaborative rooms info."));
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

    res.status(200).json({
      data: {
        shards: out.shards,
        files: out.files
      },
      error: null
    })

  } catch (error) {
    logger.error("room Repository error > createNewRoom()", error)
    next(new AppError(500, "could not create room"))
  }
}