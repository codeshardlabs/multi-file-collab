ALTER TABLE "comments" ALTER COLUMN "shard_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "replies" ALTER COLUMN "comment_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "replies" ALTER COLUMN "comment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "replies" ALTER COLUMN "parent_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "replies" ALTER COLUMN "parent_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "dependencies" ALTER COLUMN "shard_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "shard_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "likes" ALTER COLUMN "shard_id" SET DATA TYPE integer;