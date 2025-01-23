CREATE TYPE "public"."mode" AS ENUM('normal', 'collaboration');--> statement-breakpoint
CREATE TYPE "public"."template_type" AS ENUM('static', 'angular', 'react', 'react-ts', 'solid', 'svelte', 'test-ts', 'vanilla-ts', 'vanilla', 'vue', 'vue-ts', 'node', 'nextjs', 'astro', 'vite', 'vite-react', 'vite-react-ts');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('public', 'private', 'forked');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"user_id" text NOT NULL,
	"shard_id" serial NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" serial NOT NULL,
	"parent_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dependencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"version" text,
	"is_dev_dependency" boolean,
	"shard_id" serial NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"code" text,
	"hash" integer DEFAULT 0,
	"read_only" boolean DEFAULT false,
	"hidden" boolean DEFAULT false,
	"shard_id" serial NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"shard_id" serial NOT NULL,
	"liked_by" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Untitled',
	"user_id" text NOT NULL,
	"templateType" "template_type" DEFAULT 'react',
	"mode" "mode" DEFAULT 'normal',
	"type" "type" DEFAULT 'public',
	"last_sync_timestamp" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "followers" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_shard_id_shards_id_fk" FOREIGN KEY ("shard_id") REFERENCES "public"."shards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_shard_id_shards_id_fk" FOREIGN KEY ("shard_id") REFERENCES "public"."shards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_shard_id_shards_id_fk" FOREIGN KEY ("shard_id") REFERENCES "public"."shards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_shard_id_shards_id_fk" FOREIGN KEY ("shard_id") REFERENCES "public"."shards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_liked_by_users_id_fk" FOREIGN KEY ("liked_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shards" ADD CONSTRAINT "shards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followers" ADD CONSTRAINT "followers_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followers" ADD CONSTRAINT "followers_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comm_shard_id_index" ON "comments" USING btree ("shard_id");--> statement-breakpoint
CREATE INDEX "dep_shard_id_index" ON "dependencies" USING btree ("shard_id");--> statement-breakpoint
CREATE INDEX "file_shard_id_index" ON "files" USING btree ("shard_id");--> statement-breakpoint
CREATE INDEX "like_shard_id_index" ON "likes" USING btree ("shard_id");