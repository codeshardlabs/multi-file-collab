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

export async function populateLimitOffset(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const limit = req.query["limit"];
  const offset = req.query["offset"];

  req.pagination.limit = Number(limit);
  req.pagination.offset = Number(offset);
  next();
}
