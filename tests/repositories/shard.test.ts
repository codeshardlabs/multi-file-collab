import { Pool } from "pg";
import ShardRepository from "../../src/repositories/shard";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/node-postgres";
import { ShardDbType } from "../../src/db";
import * as dependencySchema from "../../src/db/tables/dependencies";
import * as fileSchema from "../../src/db/tables/files";
import * as shardSchema from "../../src/db/tables/shards";
import { sql } from "drizzle-orm";

describe("Shard Repository", () => {
    let shardRepo: ShardRepository;
    let container: PostgreSqlContainer;
    let client: Pool;
    let db: ShardDbType;

    beforeAll(async () => {
        // Create a new container instance without starting it
        container = new PostgreSqlContainer();

        // Start the container with explicit wait strategy
        const startedContainer = await container.start();
        console.log("Container started successfully");

        // Create database connection
        client = new Pool({
            connectionString: startedContainer.getConnectionUri()
        });

        // Initialize Drizzle
        db = drizzle(client, {
            schema: {
                ...shardSchema,
                ...fileSchema,
                ...dependencySchema
            }
        });


        // create enums
        await db.transaction(async (tx) => {
            await tx.execute(sql`CREATE TYPE "public"."mode" AS ENUM('normal', 'collaboration');`)
           await tx.execute(sql`CREATE TYPE "public"."template_type" AS ENUM('static', 'angular', 'react', 'react-ts', 'solid', 'svelte', 'test-ts', 'vanilla-ts', 'vanilla', 'vue', 'vue-ts', 'node', 'nextjs', 'astro', 'vite', 'vite-react', 'vite-react-ts');`);
           await tx.execute(sql`CREATE TYPE "public"."type" AS ENUM('public', 'private', 'forked');`)
            // Create shard table
            await tx.execute(sql`
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
    `);
    // create files table
    await db.execute(sql`CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"code" text,
	"read_only" boolean DEFAULT false,
	"hidden" boolean DEFAULT false,
	"shard_id" serial NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);`)
        })

      
        console.log("Database setup completed");
    }, 30000);

    beforeEach(async () => {
        shardRepo = new ShardRepository(db, shardSchema.shards, fileSchema.files);
    });

    describe("findById()", () => {
        it("should return shard for valid shard id", async () => {
            const newShard = await db.insert(shardSchema.shards).values({
                title: "Test Shard",
                userId: "test_user",
                templateType: "react",
                mode: "normal",
                type: "public"
            }).returning();
    
            expect(newShard.length).toBe(1);
            const insertedShard = await shardRepo.findById(newShard[0].id)
            expect(insertedShard).not.toBeNull();
            expect(insertedShard?.title).toBe("Test Shard");
    
            await db.execute(sql`DELETE FROM shards WHERE id = ${newShard[0].id}`);
        });

        it("should return null for non-existing shard", async () => {
            const notExistingShard = await shardRepo.findById(333333333);
            expect(notExistingShard).toBeNull();
        })
    })

    describe("getFiles()", () => {
        it("should return files for existing shard", async () => {
            const newShard = await db.insert(shardSchema.shards).values({
                title: "Test Shard",
                userId: "test_user",
                templateType: "react",
                mode: "normal",
                type: "public"
            }).returning();

            const file = await db.insert(fileSchema.files).values({
                code: "console.log('hello world');",
                name: "index.js",
                shardId: newShard[0].id
            }).returning();

            expect(newShard).not.toBeNull();
            expect(newShard.length).toBe(1);
            const files = await shardRepo.getFiles(newShard[0].id);
            expect(files?.length).toBe(1);
            expect(files?.at(0)?.name).toBe("index.js");

            await db.transaction(async (tx) => {
                await tx.execute(sql`DELETE FROM shards WHERE id = ${newShard[0].id}`);
                await tx.execute(sql`DELETE from files WHERE id = ${file[0].id}`);
            })
        })

        it("should return null for non-existent shard", async () => {
            const files = await shardRepo.getFiles(33333);
            expect(files.length).toBe(0);
        })
    })

    describe("updateLastSyncTimestamp()", () => {
        it("should update the timestamp correctly", async () => {
            const newShard = await db.insert(shardSchema.shards).values({
                title: "Test Shard",
                userId: "test_user",
                templateType: "react",
                mode: "normal",
                type: "public"
            }).returning();

            expect(newShard).not.toBeNull();
            expect(newShard.length).toBe(1);

            let lastSyncTimestamp = newShard[0].lastSyncTimestamp;
            const res = await shardRepo.updateLastSyncTimestamp(newShard[0].id);
            expect(res).toBe("OK");
            const shard = await shardRepo.findById(newShard[0].id);
            expect(lastSyncTimestamp).not.toBeNull();
            expect(shard?.lastSyncTimestamp).not.toBe(lastSyncTimestamp);

            await db.execute(`DELETE FROM shards WHERE id = ${newShard[0].id}`);
        })
    })

    describe("", () => {

    })

    afterEach(async () => {
        // Clean up test data
        await db.execute(sql`TRUNCATE TABLE shards CASCADE`);
    });

    afterAll(async () => {
        // Clean up everything
        await db.execute(sql`
            DROP TABLE IF EXISTS shards CASCADE;
        `);
        await client.end();
    });
});