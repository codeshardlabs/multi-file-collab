import { IRepository } from "../../interfaces/repositories";
import { ICommentRepository } from "../../interfaces/repositories/cache/comment";
import { IShardRepository } from "../../interfaces/repositories/cache/shard";
import { IUserRepository } from "../../interfaces/repositories/cache/user";
import { IKVService } from "../../interfaces/services/redis";
import { kvStore } from "../../services/redis/kvStore";
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
  key: string;
}

class CacheRepository {
  private repos: Map<repos, IRepository> = new Map<repos, IRepository>();
  private _globalCache: IKVService;
  private  events: QueueItem[] = [];
  private eventListLimit : number = 50;
  constructor(_cache: IKVService) {
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

  public async addToDeadLetterQueue(queueItem : QueueItem) {
    this.events.push(queueItem);
    if(this.events.length === this.eventListLimit) {
      let keys = [];
      for(let item of this.events) {
        keys.push(item.key);
      }

      await this._globalCache.del(...keys);
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
}

export const cache = new CacheRepository(kvStore);
