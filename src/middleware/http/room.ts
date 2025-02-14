import { NextFunction, Request, Response } from "express";
import { NewRoomRequestBody } from "../../routes/v1/room";
import { isOfType, shardTemplateOptions } from "../../utils";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";


export async function validateNewRoomRequestBody(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const body = req.body as NewRoomRequestBody;
  // validate if all the fields present or not
  if(!isOfType<NewRoomRequestBody>(body, ["templateType"])){
    logger.error("validation error", {
      reason: "all fields are not present"
    })
    return next(new AppError(422, "body validation error"));
  }

  if(
    !shardTemplateOptions.includes(body.templateType)
) {
      logger.error("validation error", {
        body: body,
        reason: "templateType does not match"
      })
      return next(new AppError(422, "body validation error"));
    }
    next();
}