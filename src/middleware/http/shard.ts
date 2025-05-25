import { NextFunction, Request, Response } from "express";
import { ShardPostRequestBody } from "../../routes/v1/shard/shard";
import { AppError } from "../../errors";
import { logger } from "../../services/logger/logger";
import { isOfType, shardModeOptions, shardTemplateOptions, shardTypeOptions } from "../../utils";
import { SaveShardRequestBody } from "../../routes/v1/shard/shardId";
import { Dependency } from "../../entities/dependency";

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
  _res: Response,
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

export async function validateSaveShardRequestBody(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const body = req.body as SaveShardRequestBody;
  // validate if all the fields present or not
  if(!isOfType<SaveShardRequestBody>(body, ["files", "dependencies"])){
    logger.error("validation error", {
      reason: "all fields are not present"
    })
    return next(new AppError(422, "body validation error"));
  }

  if(
    !body.files.every((file) => file.code && file.name) && 
    !body.dependencies.every((dep) => isOfType<Dependency>(dep, ["name", "isDevDependency", "version"]))
) {
      logger.error("validation error", {
        body: body,
        reason: "shard field does not match"
      })
      return next(new AppError(422, "body validation error"));
    }
    next();
}