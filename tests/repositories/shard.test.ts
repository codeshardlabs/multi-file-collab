// import { Pool } from "pg";
// import { PostgreSqlContainer } from "@testcontainers/postgresql";
// import { shardDb, ShardDbType } from "../../src/db";
// import * as fileSchema from "../../src/db/tables";
// import * as userSchema from "../../src/db/tables";
// import { sql } from "drizzle-orm";
// import { IShardRepository } from "../interfaces/repositories/db/shard";
// import ShardRepository from "./db/usecases/shard";

// describe("Shard Repository", () => {
//   let shardRepo: IShardRepository;
//   let container: PostgreSqlContainer;
//   let client: Pool;
//   let db: ShardDbType;

//   beforeAll(async () => {
//     // Create a new container instance without starting it
//     container = new PostgreSqlContainer();

//     // Start the container with explicit wait strategy
//     const startedContainer = await container.start();
//     console.log("Container started successfully");

//     // Create database connection
//     client = new Pool({
//       connectionString: startedContainer.getConnectionUri(),
//     });

//     // Initialize Drizzle
//     db = shardDb;

//     // create enums
//     await db.transaction(async (tx) => {
//       await tx.execute(
//         sql`CREATE TYPE "public"."mode" AS ENUM('normal', 'collaboration');`,
//       );
//       await tx.execute(
//         sql`CREATE TYPE "public"."template_type" AS ENUM('static', 'angular', 'react', 'react-ts', 'solid', 'svelte', 'test-ts', 'vanilla-ts', 'vanilla', 'vue', 'vue-ts', 'node', 'nextjs', 'astro', 'vite', 'vite-react', 'vite-react-ts');`,
//       );
//       await tx.execute(
//         sql`CREATE TYPE "public"."type" AS ENUM('public', 'private', 'forked');`,
//       );
//       // Create shards table
//       await tx.execute(sql`
//                 CREATE TABLE "shards" (
//         "id" serial PRIMARY KEY NOT NULL,
//         "title" text DEFAULT 'Untitled',
//         "user_id" text NOT NULL,
//         "templateType" "template_type" DEFAULT 'react',
//         "mode" "mode" DEFAULT 'normal',
//         "type" "type" DEFAULT 'public',
//         "last_sync_timestamp" timestamp DEFAULT now(),
//         "updated_at" timestamp,
//         "created_at" timestamp DEFAULT now() NOT NULL
//     );
//     `);
//       // create files table
//       await tx.execute(sql`CREATE TABLE "files" (
// 	"id" serial PRIMARY KEY NOT NULL,
// 	"name" text,
// 	"code" text,
// 	"read_only" boolean DEFAULT false,
// 	"hidden" boolean DEFAULT false,
// 	"shard_id" serial NOT NULL,
// 	"updated_at" timestamp,
// 	"created_at" timestamp DEFAULT now() NOT NULL
// );`);
//       // create  users table
//       await tx.execute(sql`CREATE TABLE "users" (
// 	"id" text PRIMARY KEY NOT NULL,
// 	"updated_at" timestamp,
// 	"created_at" timestamp DEFAULT now() NOT NULL
// );`);
//       // add foreign key constraints
//       await tx.execute(
//         sql`ALTER TABLE "shards" ADD CONSTRAINT "shards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;`,
//       );
//       await tx.execute(sql`ALTER TABLE "files" ADD CONSTRAINT "files_shard_id_shards_id_fk" FOREIGN KEY ("shard_id") REFERENCES "public"."shards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
// `);
//     });

//     console.log("Database setup completed");
//   }, 30000);

//   beforeEach(async () => {
//     shardRepo = new ShardRepository(db);
//   });

//   describe("create()", () => {
//     it("should not be created for non-existent user", async () => {
//       const shards = await shardRepo.create({
//         title: "Test Shard",
//         userId: "non-existent user",
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//       });

//       expect(shards).toBeNull();
//     });

//     it("should be able to create single shard", async () => {
//       const user = await db
//         .insert(userSchema.users)
//         .values({
//           id: "valid_user",
//         })
//         .returning();

//       expect(user).not.toBeNull();
//       expect(user.length).toBe(1);
//       const shards = await shardRepo.create({
//         title: "Test Shard",
//         userId: user[0].id,
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//       });
//       expect(shards).not.toBeNull();
//       expect(shards?.length).toBe(1);
//       expect(shards?.at(0)?.userId).toBe(user[0].id);

//       await db.transaction(async (tx) => {
//         await tx.execute(sql`DELETE FROM users WHERE id = ${user[0].id}`);
//         await tx.execute(
//           sql`DELETE FROM shards WHERE id = ${shards?.at(0)?.id}`,
//         );
//       });
//     });
//   });
//   describe("findById()", () => {
//     it("should return shard for valid shard id", async () => {
//       const user = await db
//         .insert(userSchema.users)
//         .values({
//           id: "valid_user",
//         })
//         .returning();

//       expect(user).not.toBeNull();
//       expect(user.length).toBe(1);
//       const newShard = await shardRepo.create({
//         title: "Test Shard",
//         userId: user[0].id,
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//       });
//       expect(newShard).not.toBeNull();
//       expect(newShard?.length).toBe(1);
//       const insertedShard = await shardRepo.findById(newShard?.at(0)?.id!);
//       expect(insertedShard).not.toBeNull();
//       expect(insertedShard?.title).toBe("Test Shard");
//       await db.execute(sql`DELETE FROM users WHERE id = ${user[0].id}`);
//       await db.execute(
//         sql`DELETE FROM shards WHERE id = ${newShard?.at(0)?.id!}`,
//       );
//     });

//     it("should return null for non-existing shard", async () => {
//       const notExistingShard = await shardRepo.findById(333333333);
//       expect(notExistingShard).toBeNull();
//     });
//   });

//   describe("getFiles()", () => {
//     it("should return files for existing shard", async () => {
//       const user = await db
//         .insert(userSchema.users)
//         .values({
//           id: "valid_user",
//         })
//         .returning();

//       expect(user).not.toBeNull();
//       expect(user.length).toBe(1);
//       const newShard = await shardRepo.create({
//         title: "Test Shard",
//         userId: user[0].id,
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//       });

//       const file = await db
//       .insert(fileSchema.files)
//       // @ts-ignore TODO fix this
//         .values({
//           code: "console.log('hello world');",
//           name: "index.js",
//           shardId: newShard?.at(0)?.id,
//         })
//         .returning();

//       expect(newShard).not.toBeNull();
//       expect(newShard?.length).toBe(1);
//       const files = await shardRepo.getFiles(newShard?.at(0)?.id!);
//       expect(files?.length).toBe(1);
//       expect(files?.at(0)?.name).toBe("index.js");

//       await db.transaction(async (tx) => {
//         await tx.execute(sql`DELETE FROM users WHERE id = ${user[0].id}`);
//         await tx.execute(
//           sql`DELETE FROM shards WHERE id = ${newShard?.at(0)?.id}`,
//         );
//         await tx.execute(sql`DELETE from files WHERE id = ${file[0].id}`);
//       });
//     });

//     it("should return null for non-existent shard", async () => {
//       const files = await shardRepo.getFiles(33333);
//       expect(files!.length).toBe(0);
//     });
//   });

//   describe("updateLastSyncTimestamp()", () => {
//     it("should update the timestamp correctly", async () => {
//       const user = await db
//         .insert(userSchema.users)
//         .values({
//           id: "valid_user",
//         })
//         .returning();

//       expect(user).not.toBeNull();
//       expect(user.length).toBe(1);
//       const newShard = await shardRepo.create({
//         title: "Test Shard",
//         userId: user[0].id,
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//       });

//       expect(newShard).not.toBeNull();
//       expect(newShard?.length).toBe(1);

//       let lastSyncTimestamp = newShard?.at(0)?.lastSyncTimestamp;
//       const res = await shardRepo.updateLastSyncTimestamp(newShard?.at(0)?.id!);
//       expect(res).toBe("OK");
//       const shard = await shardRepo.findById(newShard?.at(0)?.id!);
//       expect(lastSyncTimestamp).not.toBeNull();
//       expect(shard?.lastSyncTimestamp).not.toBe(lastSyncTimestamp);

//       await db.execute(`DELETE FROM shards WHERE id = ${newShard?.at(0)?.id!}`);
//       await db.execute(sql`DELETE FROM users WHERE id = ${user[0].id}`);
//     });
//   });

//   describe("getAllCollaborativeRooms()", () => {
//     it("should return valid rooms", async () => {
//       const user = await db
//         .insert(userSchema.users)
//         .values({
//           id: "valid_user",
//         })
//         .returning();

//       expect(user).not.toBeNull();
//       expect(user.length).toBe(1);
//       const newShard = await shardRepo.create({
//         title: "Test Shard",
//         userId: user[0].id,
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//       });

//       expect(newShard).not.toBeNull();
//       expect(newShard?.length).toBe(1);

//       const rooms = await shardRepo.getAllCollaborativeRooms(user[0].id, 10, 0);
//       for (let room of rooms!) {
//         expect(room.mode).toBe("collaboration");
//       }
//       await db.execute(
//         sql`DELETE FROM shards WHERE id = ${newShard?.at(0)?.id!}`,
//       );
//       await db.execute(sql`DELETE FROM users WHERE id = ${user[0].id}`);
//     });
//   });

//   describe("updateFiles()", () => {
//     it("should update the file content successfully", async () => {
//       const user = await db
//         .insert(userSchema.users)
//         .values({
//           id: "valid_user",
//         })
//         .returning();

//       expect(user).not.toBeNull();
//       expect(user.length).toBe(1);
//       const newShard = await shardRepo.create({
//         title: "Test Shard",
//         userId: user[0].id,
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//       });

//       expect(newShard).not.toBeNull();
//       expect(newShard?.length).toBe(1);
//       const file = await db
//         .insert(fileSchema.files)
//         // @ts-ignore TODO fix this
//         .values({
//           code: "console.log('hello world');",
//           name: "index.js",
//           shardId: newShard?.at(0)?.id,
//         })
//         .returning();

//       const res = await shardRepo.updateFiles(newShard?.at(0)?.id!, {
//         code: "console.log('hello.world')",
//         name: "index.js",
//       });

//       expect(res).toBe("OK");
//       const updatedFile = await shardRepo.getFiles(newShard?.at(0)?.id!);
//       expect(file[0].code).not.toBe(updatedFile![0].code);

//       await db.execute(
//         sql`DELETE FROM shards WHERE id = ${newShard?.at(0)?.id!}`,
//       );
//       await db.execute(sql`DELETE FROM users WHERE id = ${user[0].id}`);
//       await db.execute(sql`DELETE FROM files WHERE id = ${updatedFile![0].id}`);
//     });
//   });

//   describe("getShardWithFiles()", () => {
//     it("should return valid shard with files", async () => {
//       const user = await db
//         .insert(userSchema.users)
//         .values({
//           id: "valid_user",
//         })
//         .returning();

//       expect(user).not.toBeNull();
//       expect(user.length).toBe(1);
//       const newShard = await shardRepo.create({
//         title: "Test Shard",
//         userId: user[0].id,
//         templateType: "react",
//         mode: "normal",
//         type: "public",
//       });

//       expect(newShard).not.toBeNull();
//       expect(newShard?.length).toBe(1);
//       const file = await db
//         .insert(fileSchema.files)
//         // @ts-ignore TODO fix this
//         .values({
//           code: "console.log('hello world');",
//           name: "index.js",
//           shardId: newShard?.at(0)?.id,
//         })
//         .returning();
//       const shard = await shardRepo.getShardWithFiles(newShard?.at(0)?.id!);
//       expect(shard).not.toBeNull();
//       expect(shard?.files.length).toBe(1);
//       expect(shard?.files[0].code).toBe(file[0].code);
//       await db.execute(
//         sql`DELETE FROM shards WHERE id = ${newShard?.at(0)?.id!}`,
//       );
//       await db.execute(sql`DELETE FROM users WHERE id = ${user[0].id}`);
//       await db.execute(sql`DELETE FROM files WHERE id = ${file[0].id}`);
//     });
//   });

//   afterEach(async () => {
//     // Clean up test data
//     await db.execute(sql`TRUNCATE TABLE shards CASCADE`);
//     await db.execute(sql`TRUNCATE TABLE users CASCADE`);
//     await db.execute(sql`TRUNCATE TABLE files CASCADE`);
//   });

//   afterAll(async () => {
//     // Clean up everything
//     await db.execute(sql`
//             DROP TABLE IF EXISTS users CASCADE;
//         `);
//     await db.execute(sql`
//             DROP TABLE IF EXISTS shards CASCADE;
//         `);
//     await db.execute(sql`
//             DROP TABLE IF EXISTS files CASCADE;
//         `);
//     await client.end();
//   });
// });
