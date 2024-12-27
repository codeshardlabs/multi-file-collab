import { Dependency } from "./dependency";
import { File } from "./file";
import { User } from "./user";

export type TemplateType = "static" | "angular" | "react" | "react-ts" | "solid" | "svelte" | "test-ts" | "vanilla-ts" | "vanilla" | "vue" | "vue-ts"
    | "node"
    | "nextjs"
    | "astro"
    | "vite"
    | "vite-react"
    | "vite-react-ts";

export type VisibilityType = "public" | "private" | "forked";
export type ShardMode = "normal" | "collaboration";

export interface Shard {
    id: string;
    title: string;
    creator: string;
    templateType: TemplateType;
    files: File[];
    dependencies?: Dependency[];
    type: VisibilityType;
    mode: ShardMode;
    likes: number;
    likedBy: User[];
    commentThread: string;
    lastSyncTime: Date;
}