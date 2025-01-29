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

class CacheRepository {
  private repos: Map<repos, IRepository> = new Map<repos, IRepository>();
  constructor(_cache: IKVService) {
    this.repos.set("comment", new CommentRepository(_cache));
    this.repos.set("shard", new ShardRepository(_cache));
    this.repos.set("user", new UserRepository(_cache));
  }

  public get<K extends repos>(key: K): RepositoryMap[K] {
    const repo = this.repos.get(key);
    if (!repo) {
      throw new Error(`Repository ${key} not found`);
    }
    return repo as RepositoryMap[K];
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
