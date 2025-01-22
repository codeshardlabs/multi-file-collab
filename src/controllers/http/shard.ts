import type { Request, Response } from "express";
import { shardRepo } from "../../db";
import { logger } from "../../services/logger/logger";
import { ShardPostRequestBody } from "../../routes/v1/types";
import { ShardTypeType } from "../../interfaces/repositories/shard";

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

export async function createShard(req: Request, res: Response) {
    const userId = req.user.id; 
    const body = req.body as ShardPostRequestBody;
    // TODO: add validation
    try {

            await shardRepo.create({
                title: "Untitled",
                userId: userId,
                templateType: body.templateType,
                mode: body.mode,
                type: body.type, 
            });
        
        
    } catch (error) {
        
    }
}


// ?type=""&title=""
export async function updateShard(req:  Request, res: Response) {
    const userId = req.user.id;
   const query = req.query;
   const type = query.type ? query.type as ShardTypeType : "public";
   const title = query.title ? query.title as string : "";
   try {
      const out =  await shardRepo.patchShard({
        type: type,
        userId: userId,
        title: title
       })
    if(!out) throw new Error("could not patch shard");

    res.status(200).json({
        error: null,
        status: 200,
    })
   } catch (error) {
logger.error("updateShard error", error)
    res.status(500).json({
        data: null,
        error: {
            message: "could not patch shard"
        },
        status: 500
    })
   }

}


export function deleteShardById(req: Request, res: Response) {
    // TODO: implement this
}