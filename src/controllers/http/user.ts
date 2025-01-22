import {  Request, Response } from "express";
import { UserHomeRoutePostRequestBody } from "../../routes/v1/types";
import { userRepo } from "../../db";
import { logger } from "../../services/logger/logger";

export async function saveUserMetadata(req: Request, res: Response) {
    const body = req.body as UserHomeRoutePostRequestBody;
    try {
       const user =  await userRepo.onboard({
            id: body.id
        });
        if(!user) throw new Error("could not save user information")
         res.status(201).json({
            data: {
                user: user
            },
            error: null,
            status: 201
        })
        return;

    } catch (error) {
        logger.debug("saveUserMetadata error: ", error)
         res.status(500).json({
            data: null,
            error: {
                message: "Could not save user metadata"
            },
            status: 500
        });
        return;
    }
}