import { Response } from "express";
import { KVService } from "../../services/redis/kvStore";
import { IShardRepository } from "../../interfaces/repositories/shard";
import { logger } from "../../services/logger/logger";

export async function fetchLatestRoomFilesState(
  res: Response,
  id: number,
  kvStore: KVService,
  shardRepo: IShardRepository,
) {
  let shard = await shardRepo.getShardWithFiles(id);
  if (!shard) {
    res.status(500).json({
      data: null,
      error: {
        message: "Could not find resource by room ID",
      },
      status: {
        code: 500,
        message: "Internal Server Error",
      },
    });
    return;
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
      status: {
        code: 200,
        message: "OK",
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
        res.status(500).json({
          data: null,
          error: {
            message: "could not find value from redis key",
          },
          status: {
            code: 500,
            message: "Internal Server Error",
          },
        });
        return;
      }
    }

    await shardRepo.updateFiles(id, files);
    res.status(200).json({
      error: null,
      data: {
        source: "cache",
        id: id,
      },
      status: {
        code: 200,
        message: "OK",
      },
    });
    return;
  }
}
