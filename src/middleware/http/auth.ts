import { NextFunction, Request, Response } from "express";
import { errorMessage, errors } from "../../config";
import { userRepo } from "../../db";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers["authorization"];

  if (!token) {
    res.json({
      data: null,
      error: {
        message: errorMessage.get(errors.TOKEN_NOT_FOUND),
      },
      status: {
        code: 400,
        message: "Not Found",
      },
    });
    return;
  }

  let parts = token.split(" ");
  let creator = parts[1];
  if (!creator) {
    res.json({
      data: null,
      error: {
        message: errorMessage.get(errors.USER_NOT_FOUND),
      },
      status: {
        code: 400,
        message: "Not Found",
      },
    });
    return;
  }

  const user = await userRepo.findById(creator);
  if (!user) {
    res.json({
      data: null,
      error: {
        message: errorMessage.get(errors.USER_NOT_FOUND),
      },
      status: {
        code: 400,
        message: "Not Found",
      },
    });
    return;
  }

  req.user = user;
  next();
}
