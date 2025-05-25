import * as schema from "./db/tables";
import * as relations from "./db/relations";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const shardDb = drizzle({
  client: pool,
  schema: {
      ...schema,
      ...relations,
  },
});

export type ShardDbType = typeof shardDb;

export const userDb = drizzle({
  client: pool,
  schema: {
    ...schema,
    ...relations,
  },
});
export type UserDbType = typeof userDb;

export const commentDb = drizzle({
  client: pool,
  schema: {
    ...schema,
    ...relations,
  },
});



export type CommentDbType = typeof commentDb;


export const commonDb = drizzle({
  client: pool,
  schema: {
    ...schema,
    ...relations,
  },
});