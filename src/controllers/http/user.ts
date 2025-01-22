import { NextFunction, Request, Response } from "express";
import { UserPostRequestBody } from "../../routes/v1/types";
import { userRepo } from "../../db";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";

export async function saveUserMetadata(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body as UserPostRequestBody;
  try {
    const user = await userRepo.onboard({
      id: body.id,
    });
    if (!user) next(new AppError(500, "could not save user information"));
    res.status(201).json({
      data: {
        user: user,
      },
      error: null,
      status: 201,
    });
    return;
  } catch (error) {
    logger.debug("saveUserMetadata error: ", error);
    next(new AppError(500, "Could not save user metadata"));
  }
}
