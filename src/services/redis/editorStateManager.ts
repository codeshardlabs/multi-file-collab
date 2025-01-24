import { QueueService } from "./queue";
import { KVService } from "./kvStore";
import { redisConfig } from "../../config";
import { IShardRepository } from "../../interfaces/repositories/db/shard";
import { logger } from "../logger/logger";

export class EditorStateManager {
  private queueService: QueueService;
  private kvStore: KVService;
  private shardRepo: IShardRepository;
  private static FLUSH_INTERVAL: number = 5000; // every 5 sec
  constructor(shardRepo: IShardRepository, kvStore: KVService) {
    logger.info("EditorStateManager instance created");
    this.shardRepo = shardRepo;
    this.queueService = new QueueService(
      {
        queueName: "editorUpdates",
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      },
      shardRepo,
    );

    this.kvStore = kvStore;
    this.startPeriodicFlush();
  }

  private getEditorStateKey(roomId: string, activeFile: string): string {
    return `editor:${roomId}:${activeFile}:pending`;
  }

  private async startPeriodicFlush() {
    setInterval(async () => {
      try {
        // flush cache data to the DB

        const rooms = await this.shardRepo.getAllCollaborativeRooms();
        if (rooms && rooms.length > 0) {
          for (let room of rooms) {
            const id = String(room.id);
            const users_in_room = await this.kvStore.llen(id);
            if (users_in_room !== 0) {
              const lastSyncTimestamp = room.lastSyncTimestamp;
              const redisKey = `project:${id}:changes`;
              const changedFiles = await this.kvStore.zrangebyscore(
                redisKey,
                lastSyncTimestamp!.getTime(),
                "+inf",
              );
              if (changedFiles.length > 0) {
                for (const filePath of changedFiles) {
                  const key = `editor:${id}:${filePath}:pending`;
                  const fileState = await this.kvStore.hgetall(key);
                  await this.queueService.addJob(redisConfig.job.JOB_FLUSH, {
                    id,
                    filePath,
                    code: fileState.code,
                  });
                }
              }

              await this.shardRepo.updateLastSyncTimestamp(Number(id));
            }
          }
        }

        // add new job to queue
      } catch (error) {
        logger.warn("Periodic flush failed: ", {
          error: error,
        });
      }
    }, EditorStateManager.FLUSH_INTERVAL);
  }

  async cacheLatestUpdates(
    roomId: string,
    activeFile: string,
    data: string,
  ): Promise<void> {
    try {
      const pipeline = this.kvStore.multi();
      const timestamp = Date.now();
      pipeline.hset(this.getEditorStateKey(roomId, activeFile), {
        code: data,
        lastModified: timestamp,
      });
      pipeline.zadd(`project:${roomId}:changes`, timestamp, activeFile);
      await pipeline.exec();
    } catch (error) {
      logger.warn("could not cache latest updates", {
        error: error,
      });
    }
  }
}
