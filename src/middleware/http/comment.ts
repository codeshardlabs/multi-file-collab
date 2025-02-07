import { NextFunction, Request, Response } from "express";

export async function populateCommentId(
  req: Request,
  _: Response,
  next: NextFunction,
) {
  const id = req.params["id"];
  console.log(req.params);
  req.comment = {
    id: Number(id)
  }
  next();
}
