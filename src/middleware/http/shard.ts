import { NextFunction, Request, Response } from "express";

export async function populateShardId(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params["id"];
  req.shard.id = Number(id);
  next();
}
