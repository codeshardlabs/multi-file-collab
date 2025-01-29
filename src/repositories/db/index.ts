import { commentDb, shardDb, userDb } from "../../db";
import { IRepository } from "../../interfaces/repositories";
import { ICommentRepository } from "../../interfaces/repositories/db/comment";
import { IShardRepository } from "../../interfaces/repositories/db/shard";
import { IUserRepository } from "../../interfaces/repositories/db/user";
import CommentRepository from "./comment";
import ShardRepository from "./shard";
import UserRepository from "./user";


type repos = "comment" | "shard" | "user";

type RepositoryMap = {
    comment: ICommentRepository;
    shard: IShardRepository;
    user: IUserRepository;
}

class DbRepository {
    private repos :  Map<repos,IRepository> = new Map<repos, IRepository>();
  constructor() {
    this.repos.set("comment", new CommentRepository(commentDb));
    this.repos.set("shard", new ShardRepository(shardDb));
    this.repos.set("user", new UserRepository(userDb));
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

export const db = new DbRepository();