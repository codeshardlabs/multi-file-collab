
import {  Pool } from "pg";
import ShardRepository from "../../src/repositories/shard"
import {PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { drizzle } from "drizzle-orm/node-postgres";
import { ShardDbType } from "../../src/db";
import * as dependencySchema from "../../src/db/tables/dependencies";
import * as fileSchema from "../../src/db/tables/files";
import * as shardSchema from "../../src/db/tables/shards";


// TODO: Update the shard repository tests with postgres as db.
describe("Shard Repository", () => {
    
    let shardRepo: ShardRepository;
    let container: StartedPostgreSqlContainer;
    let client: Pool
    const POSTGRES_USER = 'test'
    const POSTGRES_PASSWORD = 'test'
    const POSTGRES_DB = 'test'  
    let db : ShardDbType;
    
    beforeAll(async () => {
        container = await new PostgreSqlContainer('pg_uuidv7')
        .withEnvironment({
            POSTGRES_USER: POSTGRES_USER,
            POSTGRES_PASSWORD: POSTGRES_PASSWORD,
            POSTGRES_DB: POSTGRES_DB,
        })
        .withExposedPorts(5432)
        .start()
        const connectionString = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${container.getHost()}:${container.getFirstMappedPort()}/${POSTGRES_DB}`
         client = new Pool({
            connectionString
        })
        await client.connect()
         db = drizzle({
            client: client, 
            schema: {
                ...shardSchema,
                ...fileSchema,
                ...dependencySchema
            }
        })        
        
    })

    beforeEach(() => {
        shardRepo = new ShardRepository(db , shardSchema.shards, fileSchema.files);
    })

    
    describe("findById()", () => {
        it("should return null when shard not found", async () => {
            // const newId = new mongoose.Types.ObjectId(); // non-existent id
            // const result = await shardRepo.findById(newId.toString());
            // expect(result).toBeNull();
        })

        it("should fetch shard by id", async () => {
            // const testShard = new ShardModel({
            //     title: "Test Shard",
            //     creator: "Test Creator",
            //     templateType: "react",
            //     type: "private",
            //     mode: "collaboration",
            //     likes: 0,
            // });

            // await testShard.save();
            // const result = await shardRepo.findById(testShard._id as string);
            // expect(result).not.toBeNull();
            // expect(result?.title).toBe("Test Shard");
            // await ShardModel.deleteOne({
            //     _id: testShard._id
            // })
        })
    })

    describe("save()", () => {
        it("should save the document to the database", async () => {
            // const testShard = new ShardModel({
            //     title: "Test Shard",
            //     creator: "Test Creator",
            //     templateType: "react",
            //     type: "private",
            //     mode: "collaboration",
            //     likes: 0,
            // });

            // await shardRepo.save(shardRepo.toEntity(testShard));
            // expect(testShard?._id).not.toBeNull();
            // await ShardModel.deleteOne({
            //     _id: testShard._id
            // })
        })
    })

    afterAll(async () => {
        await client.end();
        await container.stop();
    })
})