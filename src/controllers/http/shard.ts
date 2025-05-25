import type { NextFunction, Request, Response } from "express";
import { logger } from "../../services/logger/logger";
import {
  FileInput,
  // FileInput,
  PatchShardInput,
  // ShardModeType,
  // ShardTemplateType,
  ShardTypeType,
} from "../../interfaces/repositories/db/shard";
import { AppError } from "../../errors";
// import { Dependency } from "../../entities/dependency";
import { Shard, ShardWithFiles } from "../../entities/shard";
import { Comment } from "../../entities/comment";
import httpRequestTimer from "../../prometheus/histogram";
import { db } from "../../repositories/db";
import { cache } from "../../repositories/cache";
import { ShardPostRequestBody } from "../../routes/v1/shard/shard";
import { SaveShardRequestBody } from "../../routes/v1/shard/shardId";
import { DataSource, OpenAIResponseFormat, OpenAIResponseJSONRegex } from "../../constants/global.constants";
// import { File } from "../../entities/file";
import { config } from "dotenv";
import crypto from "crypto";

config();

// can cause memory leak, if not cleared => TODO handle this
const OpenAIResponseHash = new Map<string, string>();

export async function fetchShards(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.auth.user.id;
  let shards: Shard[];

  let { limit, offset } = req.pagination;

  try {
    let page = Math.floor(offset/limit) + 1;
    let src = ""
    // let cachedShards = await cache.shard.findShardsByUserId(userId, page);
    let cachedShards = null;
    if (!cachedShards) {
      const dbShards = await db.shard.findByUserId(userId, limit, offset);
      if (!dbShards) {
        return next(new AppError(500, "could not fetch shards by user id"));
      }
      src = DataSource.DB;
      shards = dbShards;
      // try{
      //   const out = await cache.shard.saveShardsByUserId(userId, dbShards, page);
      //   if (!out) {
      //     logger.warn(
      //       "could not save shards by user id to cache",
      //       "userId",
      //       userId,
      //     );
      //   }
      // }
      // catch(error) {
      //   logger.error("could not save shard by user id in cache", error);
      // }
    } else {
      src = DataSource.CACHE;
      shards = cachedShards;
    }
    res.status(200).json({
      data: {
        shards: shards,
        src : src ?? undefined
      },
      error: null,
    });
  } catch (error) {
    logger.error("fetchShards() error", error);
    return next(new AppError(500, "could not fetch shards by user id"));
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
    // let cachedShard = await cache.shard.getShardWithFiles(id);
    let cachedShard = null;
    let src = ""
    if (!cachedShard) {
      const dbShard = await db.shard.getShardWithFiles(id);
      if (!dbShard) return next(new AppError(400, "id does not exist"));
      shard = dbShard;
      src = DataSource.DB;
      // await cache.shard.saveShardWithFiles(id, dbShard);
    } else {
      src = DataSource.CACHE;
      shard = cachedShard;
    }
    res.status(200).json({
      error: null,
      data: {
        shard,
        src: src ?? undefined
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
  try {
    const existingFiles = await db.shard.getFiles(shardId);
    if (!existingFiles)
      return next(new AppError(500, "could not find shard by shard id"));

    console.log("existingFiles", existingFiles);
    console.log("body.files", body.files);
    const alreadyInserted = existingFiles.length !== 0;
    if (alreadyInserted) {
      const filesToUpdate: FileInput[] = [];
      const filesToInsert: FileInput[] = [];
       body.files.forEach((file) => {
        const existingFile = existingFiles.find((f) => f.name === file.name);
        if(existingFile && existingFile.code !== file.code) {
           filesToUpdate.push({
            code: file.code!,
            name: file.name!
          });
        }
        else if(!existingFile) {
          filesToInsert.push({
            code: file.code!,
            name: file.name!,
          });
        }
      });
      

      console.log("filesToUpdate", filesToUpdate);
      console.log("filesToInsert", filesToInsert);
      if(filesToUpdate.length > 0) {
        const out = await db.shard.updateFiles(shardId, filesToUpdate);
        if (!out) return next(new AppError(500, "could not update files"));
      }
      if(filesToInsert.length > 0) {
        const out2 = await db.shard.insertFiles(shardId, filesToInsert);
        if (!out2) return next(new AppError(500, "could not insert files"));
      }
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
  } 
}

export async function likeShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const shardId = req.shard.id;
  const userId = req.auth.user.id;
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
  }
}

export async function dislikeShard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const shardId = req.shard.id;
  const userId = req.auth.user.id;
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
  }
}

export async function getComments(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const shardId = req.shard.id;
  let comments: Comment[];
  let { limit, offset } = req.pagination;
  try {
    let page = Math.floor(offset/limit) + 1;
    let src = "";
    let cachedComments = await cache.shard.getComments(shardId, page);
    src = DataSource.CACHE
    if (!cachedComments) {
      const dbComments = await db.shard.getComments(shardId, limit, offset);
      if (!dbComments)
        return next(new AppError(500, "could not get comments for shard"));
      comments = dbComments;
      src = DataSource.DB;
      await cache.shard.saveComments(shardId, dbComments, page);
    } else {
      comments = cachedComments;
    }
    res.status(200).json({
      data: {
        comments: comments ?? [],
        src : src ?? undefined
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
  } 
}

interface AddCommentRequestBody {
  message: string;
  repliedTo?: number;
}

export async function addComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body as AddCommentRequestBody;
  const userId = req.auth.user.id;
  const shardId = req.shard.id;
  let start = Date.now();
  try {
    let commentInput = {
      message: body.message,
      shardId: shardId,
      userId: userId,
      repliedTo: body.repliedTo ?? undefined,
    };

   const comment =  await db.shard.addComment(commentInput);
   if(!comment) {
    return next(new AppError(500, "could not add comment"));
   } 
   else {
    // invalidate all the comment pages
   let out =  await cache.shard.removeCommentPages(shardId);
   if(!out) {
    await cache.addToDeadLetterQueue({
      type: "pattern",
      identifier: `shard:${shardId}:comments:page:*`
    })
    logger.warn("could not invalidate the comment pages", {
      shardId: shardId
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

    console.log("shard", shard);

    if (!shard || shard.length === 0) {
       next(new AppError(500, "could not create shard"));
    }
    // else {
    //   // invalidate all the shard pages
    //   let out = await cache.shard.removeShardPages(userId);
    //   if (!out) {
    //     await cache.addToDeadLetterQueue({
    //       type: "pattern",
    //       identifier: `user:${userId}:shards:page:*`
    //     })
    //     logger.warn("could not update shard with latest info...");
    //   }
    // }

    res.status(200).json({
      data: {
        shard: shard?.[0],
      },
      error: null,
    });

    
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
  const type = query.type ? (query.type as ShardTypeType) : undefined;
  const title = query.title ? (query.title as string) : undefined;
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
    // else {
    //   const out = await cache.shard.patchShard(shardId, patchShardInput);
    //   if (!out) {
    //     await cache.addToDeadLetterQueue({
    //       type: "key",
    //       identifier: `shard:${shardId}`
    //     }, 
    //   {
    //     type: "pattern",
    //     identifier: `user:${patchShardInput.userId}:shards:page:*`
    //   })
    //     logger.warn("could not update shard", {
    //       shardId,
    //       source: "cache",
    //       patchShardInput,
    //     });
    //   }
    // }
    res.status(200).json({
      error: null,
      data: {
        response: "OK",
      },
    });
  } catch (error) {
    logger.error("updateShard error", error);
    next(new AppError(500, "could not patch shard"));
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
  const userId = req.auth.user.id;
  try {
  const out = await db.shard.deleteById(id);
  if(!out) {
    next(new AppError(500, "could not delete shard by id"));
  }
  else {
    // invalidation
    // let out = await cache.shard.deleteShard(id, userId);
    // if(!out) {
    //   await cache.addToDeadLetterQueue({
    //     type: "key",
    //     identifier: `shard:${id}`
    //   }, {
    //     type: "pattern",
    //     identifier: `user:${userId}:shards:page:*`
    //   })
    //   logger.warn("could not invalidate shard by deleting it", {
    //     shardId: id,
    //     src: "shardController > deleteShardById()"
    //   })
    // }
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
  } 
}

interface AssistantRequestBody {
  query: string;
}

export async function handleAssistantLogic(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const shardId = req.shard.id;
  const body = req.body as AssistantRequestBody;
  const userId = req.auth.user.id;
  let start = Date.now();
  try {
    const files = await db.shard.getFiles(shardId);
    if(!files || files.length === 0) {
      return next(new AppError(500, "could not get files for shard"));
    }

    const filesToSend = files.map((file) => ({
      code: file.code,
      name: file.name,
    }));

    const response = await getResponseFromOpenAI(shardId, filesToSend, body.query);
    res.status(200).json({
      data: response?.content ? {
        content: response.content,
      } : null,
      error: response?.errorMessage ? {
        message: response?.errorMessage
      } : null,
    });
    
  }
  catch(error) {
    logger.error("handleAssistantLogic() error", error);
    next(new AppError(500, "could not handle assistant logic"));
  }
}

function generateHash(input : string) {
  try {
    const hash =  crypto.createHash('sha256').update(input).digest('hex');
    OpenAIResponseHash.set(input,hash);
    return hash;
  } catch (error) {
    logger.error("generateHash() error", error);
    return "";
  }
}

async function getResponseFromOpenAI(shardId: number, files: {code: string | null, name: string | null}[], query: string) {
  const hashInput = JSON.stringify({files, query});
  const hash = OpenAIResponseHash.get(hashInput) ?? generateHash(hashInput);
  try { 
    if(hash) {
      console.log("hash", hash);
      const cachedResponse = await cache.shard.getAssistantResponse(shardId, hash);
      console.log("cachedResponse", cachedResponse);
      if(cachedResponse) {
        return cachedResponse;
      }
    }
  }
  catch(error) {
    logger.error("getResponseFromOpenAI() error", error);
  }
 

  const openAIUrl = process.env.OPENAI_API_URL!;
  const openAIKey = process.env.OPENAI_API_KEY!;

  try {
      const openAIResponse = await fetch(openAIUrl, {
          method: 'POST',
          headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`,
      },
      body: JSON.stringify(formatOpenAIRequestBody(files, query)),
  });
  const openAIResponseData = await openAIResponse.json();
  console.log("openAIResponseData", openAIResponseData);
 const finalResponse =  extractResponseFromOpenAIResponse(openAIResponseData);
 try {
  await cache.shard.saveAssistantResponse(shardId, hash, JSON.stringify(finalResponse));
 } catch (error) {
  logger.debug('Error saving response to cache', error);
 }
 return finalResponse;
  } catch (error) {
      logger.debug('Error fetching response from OpenAI', error);
      return {
        content: "",
        errorMessage: "Could not fetch response from OpenAI"
      }
  }
}

function formatOpenAIRequestBody(files: {code: string | null, name: string | null}[], query: string) {
  return {
      "model": "gpt-4o-mini",
      "temperature": 0.3,
      "top_p": 1.0,
      "frequency_penalty": 0,
      "presence_penalty": 0,
      "messages": [
        {
          "role": "system",
          "content": "You are an advanced AI coding assistant. You help with understanding, debugging, refactoring, and extending code. You respond concisely and clearly, with explanations when helpful, and produce production-quality code.\n\nYou will receive input in this exact JSON format:\n```json\n{\n  \"files\": [{\"code\": \"<file-code-here>\", \"name\": \"<file-name-here>\"}, ...],\n  \"query\": \"<user-query-here>\"\n}\n```\n\nTreat the files as actual code files in a project. Use filenames to understand file structure and relationships. Respond as if you are collaborating with a developer inside a smart IDE.\n\nYou MUST respond in this exact JSON format only:\n```json\n{\n  \"content\": \"<markdown-formatted-response>\",\n  \"errorMessage\": \"<error-message-if-something-goes-wrong-or-null>\"\n}\n```\n\nThe content field should contain markdown-formatted text with:\n- Code blocks using ```language syntax\n- Clear explanations and analysis\n- Structured formatting with headers, lists, etc.\n- Production-quality code suggestions\n\nIf there are any issues processing the request, set errorMessage with a brief description, otherwise set it to null.\n\nDo not include any text outside the JSON response structure."
        },
        {
          "role": "user",
          "content": JSON.stringify({
            files, query
          })
        }
      ]
    }
}

function extractResponseFromOpenAIResponse(openAIResponseData: any) {
  const response =  openAIResponseData?.choices?.[0]?.message?.content ?? ""
  const match = response.match(OpenAIResponseJSONRegex)
  if(match) {
    const json = JSON.parse(match[1])
    return {
      content: json[OpenAIResponseFormat.CONTENT] ??"",
      errorMessage: json[OpenAIResponseFormat.ERROR_MESSAGE] ?? ""
    }
}

  return {
    content: "",
    errorMessage: "Could not parse response from OpenAI"
  }
}




