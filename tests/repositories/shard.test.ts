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
        await db.execute(sql`CREATE TYPE "public"."mode" AS ENUM('normal', 'collaboration');`)
       await db.execute(sql`CREATE TYPE "public"."template_type" AS ENUM('static', 'angular', 'react', 'react-ts', 'solid', 'svelte', 'test-ts', 'vanilla-ts', 'vanilla', 'vue', 'vue-ts', 'node', 'nextjs', 'astro', 'vite', 'vite-react', 'vite-react-ts');`);
       await db.execute(sql`CREATE TYPE "public"."type" AS ENUM('public', 'private', 'forked');`)
        // Create shard table
        await db.execute(sql`CREATE TABLE "shards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Untitled',
	"user_id" text NOT NULL,
	"templateType" "template_type" DEFAULT 'react',
	"mode" "mode" DEFAULT 'normal',
	"type" "type" DEFAULT 'public',
	"last_sync_timestamp" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);`);



// create 
      
        console.log("Database setup completed");
    }, 30000);

    beforeEach(async () => {
        shardRepo = new ShardRepository(db, shardSchema.shards, fileSchema.files);
    });

    it("should find shard by id", async () => {
        const result = await shardRepo.findById(999999);
        expect(result).toBeNull();
        // expect(result?.title).toBe('Test Shard');
    });

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