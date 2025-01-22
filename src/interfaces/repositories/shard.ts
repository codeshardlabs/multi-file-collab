import { File } from "../../entities/file";
import { Shard, ShardWithFiles } from "../../entities/shard";

export interface FileInput {
  code: string;
  name: string;
}

export type ShardTemplateType =
  | "static"
  | "angular"
  | "react"
  | "react-ts"
  | "solid"
  | "svelte"
  | "test-ts"
  | "vanilla-ts"
  | "vanilla"
  | "vue"
  | "vue-ts"
  | "node"
  | "nextjs"
  | "astro"
  | "vite"
  | "vite-react"
  | "vite-react-ts";

export type ShardModeType = "normal" | "collaboration";
export type ShardTypeType = "public" | "private" | "forked";
export interface ShardInput {
  title: string;
  userId: string;
  templateType: ShardTemplateType;
  mode: ShardModeType;
  type: ShardTypeType;
}

export interface PatchShardInput {
  title: string;
  type: ShardTypeType;
  userId: string;
};

export interface IShardRepository {
  create(shards: ShardInput[] | ShardInput): Promise<Shard[] | null>;
  findById(id: number): Promise<Shard | null>;
  findByUserId(id: string) : Promise<Shard[] | null>;
  getFiles(id: number): Promise<File[]>;
  updateLastSyncTimestamp(id: number): Promise<"OK" | null>;
  getAllCollaborativeRooms(userId: string): Promise<Shard[] | null>;
  updateFiles(id: number, files: FileInput[] | FileInput): Promise<"OK" | null>;
  getShardWithFiles(id: number): Promise<ShardWithFiles | null>;
  patchShard(patchShardInput: PatchShardInput) : Promise<"OK" | null>
}
