import { Schema, model } from "mongoose";
import { fileSchema } from "./file";
import { dependencySchema } from "./dependency";
import { User } from "./user";
import { Comment } from "./comment";
import { ShardDocument } from "../repositories/shardRepository";

const shardSchema = new Schema(
  {
    title: {
      type: String,
      default: "Untitled",
    },
    creator: {
      type: String,
    },
    templateType: {
      type: String,
      enum: [
        "static",
        "angular",
        "react",
        "react-ts",
        "solid",
        "svelte",
        "test-ts",
        "vanilla-ts",
        "vanilla",
        "vue",
        "vue-ts",
        "node",
        "nextjs",
        "astro",
        "vite",
        "vite-react",
        "vite-react-ts",
      ]
    },
    files: [fileSchema],
    dependencies: [dependencySchema],
    tags: [String],
    type: {
      type: String,
      default: "public",
      enum: ["public", "private", "forked"],
    },
    mode: {
      type: String,
      default: "normal",
      enum: ["normal", "collaboration"],
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "User",
    },
    commentThread: Schema.Types.ObjectId,
    lastSyncTime: {
      type: Date,
      default: Date.now()
    },
  },
  {
    timestamps: true,
  },
);


export const Shard = model<ShardDocument>("Shard", shardSchema);