import { NextFunction, Request, Response } from "express";
import { logger } from "../../services/logger/logger";
import { shardRepo } from "../../db";
import { kvStore } from "../../services/redis/kvStore";
import { AppError } from "../../errors";

export async function fetchLatestRoomFilesState(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.id;
  let shard = await shardRepo.getShardWithFiles(id);
  if (!shard) {
    next(new AppError(500, "Could not find resource by room ID"));
  }

  let pattern = `editor:${id}:*:pending`;
  const keys = await kvStore.keys(pattern);
  if (keys.length == 0) {
    // cache not populated
    // room found
     res.status(200).json({
      error: null,
      data: {
        source: "db",
        shard: shard,
      },
    });
    return;
  } else {
    let files = [];
    for (let key of keys) {
      // TODO: optimize the asynchronous code
      logger.debug("fetchLatestRoomFilesState(): key", {
        key: key,
      });
      const record = await kvStore.hgetall(key);
      let temp = key;
      let keyParts = temp.split(":");
      if (record) {
        files.push({
          code: record.code,
          name: keyParts[2],
        });
      } else {
        return next(new AppError(500, "could not find value from redis key"));
      }
    }

    await shardRepo.updateFiles(id, files);
    res.status(200).json({
      error: null,
      data: {
        source: "cache",
        id: id,
      },
    });
    return;
  }
}

export async function fetchAllRooms(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user.id;
  try {
    const rooms = await shardRepo.getAllCollaborativeRooms(userId);
    if (!rooms) {
      return next(new AppError(500, "could not fetch rooms"));
    }

    res.status(200).json({
      data: {
        rooms
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchAllRoom() route error", error);
    return next(new AppError(500, "could not fetch collaborative rooms info."));
  }
}
