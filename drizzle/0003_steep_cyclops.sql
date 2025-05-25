DROP INDEX "comm_shard_id_index";--> statement-breakpoint
DROP INDEX "dep_shard_id_index";--> statement-breakpoint
DROP INDEX "file_shard_id_index";--> statement-breakpoint
DROP INDEX "like_shard_id_index";--> statement-breakpoint
ALTER TABLE "replies" ALTER COLUMN "comment_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "replies" ALTER COLUMN "parent_id" SET NOT NULL;