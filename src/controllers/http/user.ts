import { NextFunction, Request, Response } from "express";
import { userRepo } from "../../db";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";

 interface UserPostRequestBody {
  id: string;
}

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
      error: null
    });
    return;
  } catch (error) {
    logger.debug("saveUserMetadata error: ", error);
    next(new AppError(500, "Could not save user metadata"));
  }
}

export async function getUserInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.user.id;
    const user = await userRepo.findByIdWithFollowersList(id);
  } catch (error) {
    logger.debug("userController > getUserInfo() error", error);
    next(new AppError(500, "could not get user info"));
  }
}

export async function followUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.auth.user.id;
  const userBeingFollowed = req.user.id;

}

export async function unfollowUser(req: Request, res: Response, next: NextFunction) {

}