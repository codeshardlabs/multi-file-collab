import { shards } from "../db/tables";
import { File } from "./file";

//Reference: https://stackoverflow.com/a/78473818
export type Shard = typeof shards.$inferSelect;

export interface ShardWithFiles extends Shard {
  files: File[];
}
