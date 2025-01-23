// import * as commentSchema from "./db/tables/comments";
import * as dependencySchema from "./db/tables/dependencies";
import * as fileSchema from "./db/tables/files";
import * as shardSchema from "./db/tables/shards";
import * as userSchema from "./db/tables/users";
import * as commentSchema from "./db/tables/comments";
import * as likeSchema from "./db/tables/likes";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import ShardRepository from "./repositories/shard";
import UserRepository from "./repositories/user";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const shardDb = drizzle({
  client: pool,
  schema: {
    ...shardSchema,
    ...fileSchema,
    ...dependencySchema,
    ...commentSchema,
    ...likeSchema
  },
});

export type ShardDbType = typeof shardDb;

export const userDb = drizzle({
  client: pool,
  schema: {
    ...userSchema,
  },
});
export type UserDbType = typeof userDb;

export const shardRepo = new ShardRepository(shardDb);
export const userRepo = new UserRepository(userDb);
