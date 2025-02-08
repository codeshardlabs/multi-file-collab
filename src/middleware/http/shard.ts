import { NextFunction, Request, Response } from "express";
import { ShardPostRequestBody } from "../../routes/v1/shard/shard";
import { AppError } from "../../errors";
import { logger } from "../../services/logger/logger";
import { isOfType, shardModeOptions, shardTemplateOptions, shardTypeOptions } from "../../utils";

export async function populateShardId(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params["id"];
  req.shard = {
    id: Number(id)
  }
  next();
}


export async function validateCreateShardRequestBody(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const body = req.body as ShardPostRequestBody;
  // validate if all the fields present or not
  if(!isOfType<ShardPostRequestBody>(body, ["templateType", "mode", "type"])){
    logger.error("validation error", {
      reason: "all fields are not present"
    })
    return next(new AppError(422, "body validation error"));
  }

  if(!shardTemplateOptions.includes(body.templateType)
     || !shardModeOptions.includes(body.mode)
    || !shardTypeOptions.includes(body.type)) {
      logger.error("validation error", {
        body: body,
        reason: "shard field does not match"
      })
      return next(new AppError(422, "body validation error"));
    }
    next();
}