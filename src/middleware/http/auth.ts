import { NextFunction, Request, Response } from "express";
import { errorMessage, errors } from "../../config";
import { AppError } from "../../errors";
import { db } from "../../repositories/db";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers["authorization"];

  if (!token) {
    return next(new AppError(400, errorMessage.get(errors.TOKEN_NOT_FOUND)!));
  }
console.log("token: ", token)
  let parts = token.split(" ");
  let creator = parts[1];
  if (!creator) {
    return next(new AppError(400, errorMessage.get(errors.USER_NOT_FOUND)!));
  }

  const user = await db.user.findById(creator);
  console.log("user: ", user)
  if (!user) {
    return next(new AppError(400, errorMessage.get(errors.USER_NOT_FOUND)!));
  }

  req.auth = {
    user
  }
  next();
}
