import { NextFunction, Request, Response } from "express";

export async function populateCommentId(req: Request, res: Response, next: NextFunction) {
    const id = req.params["id"];
    req.comment.id = Number(id);
    next();
}