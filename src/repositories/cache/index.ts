import { IRepository } from "../../interfaces/repositories";
import { ICommentRepository } from "../../interfaces/repositories/cache/comment";
import { IShardRepository } from "../../interfaces/repositories/cache/shard";
import { IUserRepository } from "../../interfaces/repositories/cache/user";
import { ICacheService } from "../../interfaces/services/cache";
import { logger } from "../../services/logger/logger";
import { cacheService } from "../../services/redis/cache/cache";
import CommentRepository from "./usecases/comment";
import ShardRepository from "./usecases/shard";
import UserRepository from "./usecases/user";

type repos = "comment" | "shard" | "user";

type RepositoryMap = {
  comment: ICommentRepository;
  shard: IShardRepository;
  user: IUserRepository;
};

interface QueueItem {
  identifier: string;
  type: "pattern" | "key";
}

class CacheRepository {
  private repos: Map<repos, IRepository> = new Map<repos, IRepository>();
  private _globalCache: ICacheService;
  private events: QueueItem[] = [];
  private maxRetryAttempts: number = 3;
  private eventListLimit: number = 50;
  constructor(_cache: ICacheService) {
    this.repos.set("comment", new CommentRepository(_cache));
    this.repos.set("shard", new ShardRepository(_cache));
    this.repos.set("user", new UserRepository(_cache));
    this._globalCache = _cache;
  }


  public get<K extends repos>(key: K): RepositoryMap[K] {
    const repo = this.repos.get(key);
    if (!repo) {
      throw new Error(`Repository ${key} not found`);
    }
    return repo as RepositoryMap[K];
  }

  public async addToDeadLetterQueue(...queueItems: QueueItem[]) {
    this.events.push(...queueItems);
    if (this.events.length === this.eventListLimit) {
      try {
        await this.processDLQ();
      } catch (finalError) {
        // Handle final failure scenario
        logger.error("Failed to process Dead Letter Queue after max attempts", {
          error: finalError,
          queueItems: this.events
        });
      }
    }
  }

  

  public get comment(): ICommentRepository {
    return this.get("comment");
  }

  public get shard(): IShardRepository {
    return this.get("shard");
  }

  public get user(): IUserRepository {
    return this.get("user");
  }

  private async processDLQ() {
    let localCache = new Map<string, string[]>();
    for(let attempt = 1;attempt<= this.maxRetryAttempts;attempt++) {
      const finalKeys = this.events.filter(item => item.type === "key").map((item) => item.identifier);
      const queuePatterns = this.events.filter(item => item.type === "pattern");
      for (let item of queuePatterns) {
        if(localCache.get(item.identifier) === undefined) {
          const keys = await this._globalCache.keys(item.identifier);
          localCache.set(item.identifier, keys);
          finalKeys.push(...keys);
        } 
        else {
          finalKeys.push(...localCache.get(item.identifier)!);
        }
      }
      
      try {
        const count = await this._globalCache.del(...finalKeys);
        
        if (count === finalKeys.length) {
          this.events = []; 
          return;
        }
        
        throw new Error("Could not delete all keys");
      } catch (error) {
        logger.warn(`DLQ deletion attempt ${attempt} failed`, {
          error,
          src: "CacheRepository > processDLQ()"
        });
  
        // exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        );
  
    }
  }
}
}

export const cache = new CacheRepository(cacheService);
