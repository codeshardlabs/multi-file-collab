
import { QueueService } from "./queue";
import { KVService } from "./kvStore";
import { redisConfig } from "../../config";
import { IShardRepository } from "../../interfaces/IShardRepository";

export class EditorStateManager {
    private queueService: QueueService;
    private kvStore: KVService;
    private static FLUSH_INTERVAL: number = 5000; // every 5 sec
    constructor(shardRepo: IShardRepository) {
        this.queueService = new QueueService({
            queueName: "editorUpdates",
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential"
                    , delay: 1000
                }
            }
        },
            shardRepo);

        this.kvStore = new KVService();
        this.startPeriodicFlush();
    }

    private getEditorStateKey(roomId: string, activeFile: string): string {
        return `editor:${roomId}:${activeFile}:pending`;
    }

    private async startPeriodicFlush() {
        setInterval(async () => {
            try {
                // flush cache data to the DB
                let pattern = "editor:*:pending";
                const keys = await this.kvStore.keys(pattern);
                for (let key of keys) {
                    const keyParts = key.split(":");
                    const value = await this.kvStore.get(key);
                    const roomId = keyParts[1];
                    const activeFile = keyParts[2];
                    // add new job to queue
                    await this.queueService.addJob(redisConfig.job.JOB_FLUSH, {
                        roomId,
                        activeFile,
                        code: value
                    });

                    // delete (k,v) pair from the cache
                    await this.kvStore.del(key);
                }

            } catch (error) {
                console.log("Periodic flush failed: ", error);
            }

        }, EditorStateManager.FLUSH_INTERVAL);
    }

    async cacheLatestUpdates(roomId: string, activeFile: string, data: string): Promise<void> {
        try {
            await this.kvStore.set(this.getEditorStateKey(roomId, activeFile), data);
        } catch (error) {
            console.log(error);
        }
    }
}