import { IRepository } from "..";
import { Comment } from "../../../entities/comment";
import { File } from "../../../entities/file";
import { Shard, ShardWithFiles } from "../../../entities/shard";

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
}

export interface CommentInput {
  message: string;
  userId: string;
  shardId: number;
}

export interface IShardRepository extends IRepository {
  create(shards: ShardInput[] | ShardInput): Promise<Shard[] | null>;
  findById(id: number): Promise<Shard | null>;
  deleteById(id: number): Promise<"OK" | null>;
  findByUserId(id: string): Promise<Shard[] | null>;
  getFiles(id: number): Promise<File[] | null>;
  updateFiles(id: number, files: FileInput[] | FileInput): Promise<"OK" | null>;
  insertFiles(id: number, fileInput: FileInput[]): Promise<"OK" | null>;
  updateLastSyncTimestamp(id: number): Promise<"OK" | null>;
  getAllCollaborativeRooms(userId: string): Promise<Shard[] | null>;
  getShardWithFiles(id: number): Promise<ShardWithFiles | null>;
  patch(patchShardInput: PatchShardInput): Promise<"OK" | null>;
  getComments(id: number): Promise<Comment[] | null>;
  like(shardId: number, userId: string): Promise<"OK" | null>;
  dislike(shardId: number, userId: string): Promise<"OK" | null>;
  addComment(commentInput: CommentInput): Promise<Comment | null>;
  deleteComment(commentId: number): Promise<"OK" | null>;
}
