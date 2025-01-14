import { shards } from "../db/tables/shards";


//Reference: https://stackoverflow.com/a/78473818
export type Shard = typeof shards.$inferSelect;