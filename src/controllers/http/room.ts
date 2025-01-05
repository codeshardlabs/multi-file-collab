import { Response } from "express";
import { KVService } from "../../services/redis/kvStore";
import ShardRepository from "../../repositories/shardRepository";
import { File } from "../../entities/file";

export async function fetchLatestRoomFilesState(res: Response, id: string, kvStore: KVService, shardRepo: ShardRepository) {
    let shard = await shardRepo.findById(id);
    if (!shard) {
        res.status(500).json({
            data: null,
            error: {
                message: "Could not find resource by room ID"
            },
            status: {
                code: 500,
                message: "Internal Server Error"
            }
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
                shard: shard
            },
            status: {
                code: 200,
                message: "OK"
            }
        })
        return;
    }
    else {
        let files: File[] = [];
        for (let key of keys) {
            // TODO: optimize the asynchronous code
            console.log("key", key);
            const record = await kvStore.hgetall(`editor:${id}:${key}:pending`);
            if (record) {
                files.push({
                    code: record.code,
                    name: key,
                });
            }
            else {
                res.status(500).json({
                    data: null,
                    error: {
                        message: "could not find value from redis key"
                    },
                    status: {
                        code: 500,
                        message: "Internal Server Error"
                    }
                });
                return;
            }
        }

        shard.files = files;
        res.status(200).json({
            error: null,
            data: {
                source: "cache",
                shard: shard
            },
            status: {
                code: 200,
                message: "OK"
            }
        })
        return;
    }

}