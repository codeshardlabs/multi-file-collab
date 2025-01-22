import { Request, Response } from "express";
import { shardRepo } from "../../db";
import { logger } from "../../services/logger/logger";

export async function fetchShards(req: Request, res: Response) {
    const userId = req.user.id;

try {
    const shards = await shardRepo.findByUserId(userId);
    if(!shards) {
        throw new Error("could not fetch shards by user id");
    }
} catch (error) {
    logger.error("fetchShards() error", error);
    res.status(500).json({
        data: null,
        error: {
            message: "could not fetch shards by user id"
        },
        status: 500
    })
}
}

export function fetchShardById(req: Request, res: Response) {
    // TODO: implement this
}

export function saveShard(req: Request, res: Response) {
    // TODO: implement this
}

// ?title=""&type=""
export function updateShard(req: Request, res: Response) {
    // TODO: implement this
}


export function deleteShardById(req: Request, res: Response) {
    // TODO: implement this
}