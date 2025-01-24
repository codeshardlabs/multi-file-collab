import { NextFunction, Request, Response } from "express";
import { errorMessage, errors } from "../../config";
import { userRepo } from "../../db";
import { AppError } from "../../errors";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers["authorization"];

  if (!token) {
    return next(new AppError(400, errorMessage.get(errors.TOKEN_NOT_FOUND)!));
  }

  let parts = token.split(" ");
  let creator = parts[1];
  if (!creator) {
    return next(new AppError(400, errorMessage.get(errors.USER_NOT_FOUND)!));
  }

  const user = await userRepo.findById(creator);
  if (!user) {
    return next(new AppError(400, errorMessage.get(errors.USER_NOT_FOUND)!));
  }

  req.auth.user = user;
  next();
}
