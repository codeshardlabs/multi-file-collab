import { Response } from "express";
import { KVService } from "../services/redis/kvStore";
import ShardRepository from "../repositories/ShardRepository";
import { File } from "../entities/file";

export async function fetchLatestRoomFilesState(res: Response, id: string, kvStore: KVService, shardRepo: ShardRepository) {
    let pattern = `editor:${id}:*:pending`;
    const keys = await kvStore.keys(pattern);
    if (keys.length == 0) {
        // cache not populated
        const room = await shardRepo.findById(id);
        if (!room) {
            res.status(500).json({
                data: null,
                error: {
                    message: "Could not find room by room ID"
                },
                status: {
                    code: 500,
                    message: "Internal Server Error"
                }
            });
            return;
        }
        // room found 
        const files = room.files.length > 0 ? room.files.map((file) => {
            return {
                code: file.code,
                name: file.name,
            }
        }) : [];
        res.status(200).json({
            error: null,
            data: {
                source: "db",
                files: files
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
            const value = await kvStore.get(`${id}:${key}`);
            if (value) {
                files.push({
                    code: value,
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

        res.status(200).json({
            error: null,
            data: {
                source: "cache",
                files: files
            },
            status: {
                code: 200,
                message: "OK"
            }
        })
        return;
    }

}