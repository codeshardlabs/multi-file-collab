import { NextFunction, Request, Response } from "express";


export async function populateUserId(req: Request, res: Response, next: NextFunction) {
    const id = req.params["id"];
    req.user.id = id;
    next();
}