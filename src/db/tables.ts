// schema/tables.ts
import {
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    integer,
    boolean
  } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamp";
  
  
  // Enums
  export const templateTypeEnum = pgEnum("template_type", [
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
  ]);
  export const modeEnum = pgEnum("mode", ["normal", "collaboration"]);
  export const typeEnum = pgEnum("type", ["public", "private", "forked"]);
  
  // Tables
  export const users = pgTable("users", {
    id: text("id").primaryKey(),
    ...timestamps,
  });
  
  export const followers = pgTable("followers", {
    id: serial("id").primaryKey(),
    followerId: text("follower_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    followingId: text("following_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  });
  
  export const shards = pgTable("shards", {
    id: serial("id").primaryKey(),
    title: text("title").default("Untitled"),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    templateType: templateTypeEnum("template_type").default("react"),
    mode: modeEnum().default("normal"),
    type: typeEnum().default("public"),
    lastSyncTimestamp: timestamp("last_sync_timestamp").defaultNow(),
    ...timestamps,
  });
  
  export const assignments = pgTable("assignments", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    deadline: timestamp("deadline").notNull(),
    requirements: text("requirements").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
    ...timestamps,
  });
  
  export const submissions = pgTable("submissions", {
    id: serial("id").primaryKey(),
    assignmentId: integer("assignment_id").references(() => assignments.id, { onDelete: "cascade" }).notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    shardId: text("shard_id").notNull(),
    ...timestamps,
  });
  
  export const comments = pgTable("comments", {
    id: serial("id").primaryKey(),
    message: text("message").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    shardId: integer("shard_id").references(() => shards.id, { onDelete: "cascade" }).notNull(),
    ...timestamps,
  });
  
  export const replies = pgTable("replies", {
    id: serial("id").primaryKey(),
    repliedBy: integer("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
    repliedTo: integer("parent_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
    ...timestamps,
  });
  
  export const dependencies = pgTable("dependencies", {
    id: serial("id").primaryKey(),
    name: text("name"),
    version: text("version"),
    isDevDependency: boolean("is_dev_dependency"),
    shardId: integer("shard_id").references(() => shards.id, { onDelete: "cascade" }).notNull(),
    ...timestamps,
  });
  
  export const files = pgTable("files", {
    id: serial("id").primaryKey(),
    name: text("name"),
    code: text("code"),
    hash: integer("hash").default(0),
    readOnly: boolean("read_only").default(false),
    hidden: boolean("hidden").default(false),
    shardId: integer("shard_id").references(() => shards.id, { onDelete: "cascade" }).notNull(),
    ...timestamps,
  });
  
  export const likes = pgTable("likes", {
    id: serial("id").primaryKey(),
    shardId: integer("shard_id").references(() => shards.id, { onDelete: "cascade" }).notNull(),
    likedBy: text("liked_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
    ...timestamps,
  });
  