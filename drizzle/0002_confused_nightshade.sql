ALTER TABLE "shards" RENAME COLUMN "templateType" TO "template_type";--> statement-breakpoint
ALTER TABLE "replies" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "replies" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;