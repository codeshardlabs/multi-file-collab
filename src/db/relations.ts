// schema/relations.ts
import { relations } from "drizzle-orm";
import {
  users, followers, shards, comments,
  replies, dependencies, files, likes
} from "./tables";

// User Relations
export const usersRelations = relations(users, ({ many }) => ({
  followers: many(followers),
  following: many(followers),
  shards: many(shards),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(users, {
    fields: [followers.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [followers.followingId],
    references: [users.id],
  }),
}));

// Shards
export const shardsRelations = relations(shards, ({ many }) => ({
  comments: many(comments),
  dependencies: many(dependencies),
  files: many(files),
  likes: many(likes),
}));

// Comments + Replies
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  replies: many(replies),
}));

export const repliesRelations = relations(replies, ({ one }) => ({
  comment: one(comments, {
    fields: [replies.repliedTo],
    references: [comments.id]
  })
}));

// Dependencies
export const dependenciesRelations = relations(dependencies, ({ one }) => ({
  shard: one(shards, {
    fields: [dependencies.shardId],
    references: [shards.id],
  }),
}));

// Files
export const filesRelations = relations(files, ({ one }) => ({
  shard: one(shards, {
    fields: [files.shardId],
    references: [shards.id],
  }),
}));

// Likes
export const likesRelations = relations(likes, ({ one }) => ({
  shard: one(shards, {
    fields: [likes.shardId],
    references: [shards.id],
  }),
}));
