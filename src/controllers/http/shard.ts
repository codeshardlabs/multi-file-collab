import type { NextFunction, Request, Response } from "express";
import { logger } from "../../services/logger/logger";
import {
  FileInput,
  PatchShardInput,
  ShardModeType,
  ShardTemplateType,
  ShardTypeType,
} from "../../interfaces/repositories/db/shard";
import { AppError } from "../../errors";
import { Dependency } from "../../entities/dependency";
import { Shard, ShardWithFiles } from "../../entities/shard";
import { Comment } from "../../entities/comment";
import httpRequestTimer from "../../prometheus/histogram";
import { db } from "../../repositories/db";
import { cache } from "../../repositories/cache";
import { ShardPostRequestBody } from "../../routes/v1/shard/shard";


export async function fetchShards(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;
  let shards: Shard[];
  let start = Date.now();

  let { limit, offset } = req.pagination;

  try {
    let page = Math.floor(offset/limit) + 1;
    let cachedShards = await cache.shard.findShardsByUserId(userId, page);
    if (!cachedShards) {
      const dbShards = await db.shard.findByUserId(userId, limit, offset);
      if (!dbShards) {
        return next(new AppError(500, "could not fetch shards by user id"));
      }
      shards = dbShards;
      const out = await cache.shard.saveShardsByUserId(userId, dbShards, page);
      if (!out) {
        logger.warn(
          "could not save shards by user id to cache",
          "userId",
          userId,
        );
      }
    } else {
      shards = cachedShards;
    }
    res.status(200).json({
      data: {
        shards: shards,
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchShards() error", error);
    return next(new AppError(500, "could not fetch shards by user id"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function fetchShardById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.shard.id;
  const start = Date.now();
  let shard: ShardWithFiles;
  try {
    let cachedShard = await cache.shard.getShardWithFiles(id);
    if (!cachedShard) {
      const dbShard = await db.shard.getShardWithFiles(id);
      if (!dbShard) return next(new AppError(400, "id does not exist"));
      shard = dbShard;
      await cache.shard.saveShardWithFiles(id, dbShard);
    } else {
      shard = cachedShard;
    }
    res.status(200).json({
      error: null,
      data: {
        shard,
      },
    });
  } catch (error) {
    logger.error("fetchShardById() error", error);
    return next(new AppError(500, "could not fetch shard by id"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

interface SaveShardRequestBody {
  files: FileInput[];
  dependencies: Dependency[];
  
}

// 1. Get files from db By shard Id.
// 2. if files already present, update the files in db.
// 3. if could not update the files, throw error.
// 4. if files are not present, insert the files for first time in the db.
export async function saveShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const shardId = req.shard.id;
  const body = req.body as SaveShardRequestBody;
  let start = Date.now();
  try {
    const existingFiles = await db.shard.getFiles(shardId);
    if (!existingFiles)
      return next(new AppError(400, "could not find shard by shard id"));

    const alreadyInserted = existingFiles.length !== 0;
    if (alreadyInserted) {
      const out = await db.shard.updateFiles(shardId, body.files);
      if (!out) return next(new AppError(500, "could not update files"));
    } else {
      const out = await db.shard.insertFiles(shardId, body.files);
      if (!out) return next(new AppError(500, "could not insert files"));
    }

    res.status(200).json({
      data: {
        response: "OK",
      },
      error: null,
    });
  } catch (error) {
    logger.error(
      "shardControlller > saveShard()",
      "error",
      error,
      "shardId",
      shardId,
    );
    next(new AppError(500, `could not save shard for ${shardId}`));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function likeShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const shardId = req.shard.id;
  const userId = req.auth.user.id;
  let start = Date.now();
  try {
    const out = await db.shard.like(shardId, userId);
    if (!out) return next(new AppError(500, "could not like shard"));
    res.status(200).json({
      data: {
        response: "OK",
      },
      error: null,
    });
  } catch (error) {
    logger.debug(
      "shardController > likeShard() error",
      error,
      "shardId",
      shardId,
    );
    next(new AppError(500, `could not like shard for shard id: ${shardId}`));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function dislikeShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const shardId = req.shard.id;
  const userId = req.auth.user.id;
  let start = Date.now();
  try {
    const out = await db.shard.dislike(shardId, userId);
    if (!out) return next(new AppError(500, "could not dislike shard"));
    res.status(200).json({
      data: {
        response: "OK",
      },
      error: null,
    });
  } catch (error) {
    logger.debug(
      "shardController > dislikeShard() error",
      error,
      "shardId",
      shardId,
    );
    next(new AppError(500, `could not dislike shard for shard id: ${shardId}`));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function getComments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const shardId = req.shard.id;
  let comments: Comment[];
  let start = Date.now();
  let { limit, offset } = req.pagination;
  try {
    let page = Math.floor(offset/limit) + 1;
    let cachedComments = await cache.shard.getComments(shardId, page);
    if (!cachedComments) {
      const dbComments = await db.shard.getComments(shardId, limit, offset);
      if (!dbComments)
        return next(new AppError(500, "could not get comments for shard"));
      comments = dbComments;
      await cache.shard.saveComments(shardId, dbComments, page);
    } else {
      comments = cachedComments;
    }
    res.status(200).json({
      data: {
        comments,
      },
      error: null,
    });
  } catch (error) {
    logger.debug(
      "shardController > getComments() error",
      error,
      "shardId",
      shardId,
    );
    next(new AppError(500, `could not get comments for shard id: ${shardId}`));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

interface AddCommentRequestBody {
  message: string;
  shardId: number;
}

export async function addComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body as AddCommentRequestBody;
  const userId = req.auth.user.id;
  let start = Date.now();
  try {
    let commentInput = {
      message: body.message,
      shardId: body.shardId,
      userId: userId,
    };

   const comment =  await db.shard.addComment(commentInput);
   if(!comment) {
    return next(new AppError(500, "could not add comment"));
   } 
   else {
    // invalidate all the comment pages
   let out =  await cache.shard.removeCommentPages(body.shardId);
   if(!out) {
    await cache.addToDeadLetterQueue({
      type: "pattern",
      identifier: `shard:${body.shardId}:comments:page:*`
    })
    logger.warn("could not invalidate the comment pages", {
      shardId: body.shardId
    })
   }
   }
    res.status(200).json({
      data: {
        response: "OK",
      },
      error: null,
    });
  } catch (error) {
    logger.debug(
      "shardController > addComment() error",
      error,
      "userId",
      userId,
    );
    next(new AppError(500, `could not add comment for user id: ${userId}`));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

// 1. create shard by database in shard id.
// 2. update cache
export async function createShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;
  const body = req.body as ShardPostRequestBody;
  let start = Date.now();
 
  try {
    const shard = await db.shard.create({
      title: "Untitled",
      userId: userId,
      templateType: body.templateType,
      mode: body.mode,
      type: body.type,
    });

    if (!shard) {
      return next(new AppError(500, "could not create shard"));
    }
    else {
      // invalidate all the shard pages
      let out = await cache.shard.removeShardPages(userId);
      if (!out) {
        await cache.addToDeadLetterQueue({
          type: "pattern",
          identifier: `user:${userId}:shards:page:*`
        })
        logger.warn("could not update shard with latest info...");
      }
      res.status(200).json({
        data: {
          shard: shard,
        },
        error: null,
      });
    }

    
  } catch (error) {
    logger.error("shardController > createShard()", {
      error: error,
      userId: userId,
    });
    next(new AppError(500, "could not create shard"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

// 1. update in db
// 2. invalidate cache
export async function updateShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;
  const shardId = req.shard.id;
  const query = req.query;
  const type = query.type ? (query.type as ShardTypeType) : "public";
  const title = query.title ? (query.title as string) : "";
  let start = Date.now();
  try {
    const patchShardInput: PatchShardInput = {
      type: type,
      title: title,
      userId: userId,
    };
    const out = await db.shard.patch(patchShardInput);
    if (!out)
      return next(
        new AppError(500, `could not patch shard with shard id: ${shardId}`),
      );
    else {
      const out = await cache.shard.patchShard(shardId, patchShardInput);
      if (!out) {
        await cache.addToDeadLetterQueue({
          type: "key",
          identifier: `shard:${shardId}`
        }, 
      {
        type: "pattern",
        identifier: `user:${patchShardInput.userId}:shards:page:*`
      })
        logger.warn("could not update shard", {
          shardId,
          source: "cache",
          patchShardInput,
        });
      }
    }
    res.status(200).json({
      error: null,
      data: {
        response: "OK",
      },
    });
  } catch (error) {
    logger.error("updateShard error", error);
    next(new AppError(500, "could not patch shard"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

// 1. delete shard from the database by shard id
// 2. invalidate cache by deleting shard
// here, it matters that the deletion occurs from all the datastores.
// thus, we will utilize transaction repository here
export async function deleteShardById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.shard.id;
  let start = Date.now();
  const userId = req.auth.user.id;
  try {
  const out = await db.shard.deleteById(id);
  if(!out) {
    next(new AppError(500, "could not delete shard by id"));
  }
  else {
    // invalidation
    let out = await cache.shard.deleteShard(id, userId);
    if(!out) {
      await cache.addToDeadLetterQueue({
        type: "key",
        identifier: `shard:${id}`
      }, {
        type: "pattern",
        identifier: `user:${userId}:shards:page:*`
      })
      logger.warn("could not invalidate shard by deleting it", {
        shardId: id,
        src: "shardController > deleteShardById()"
      })
    }
    res.status(200).json({
      error: null,
      data: {
        response: "OK",
      },
    });
  }
  } catch (error) {
    logger.error("deleteShardById() error", error);
    next(new AppError(500, "could not delete shard by id"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}
