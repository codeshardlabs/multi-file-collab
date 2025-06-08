// import request from "supertest";
// import { app } from "../../../src/app";
// import { jest } from '@jest/globals';

// let calculatePageNo = (offset: number, limit: number) => {
//   return Math.floor(offset/limit) + 1;
// }
// jest.mock("../../../src/repositories/db", () => ({
//   db: {
//     user: {
//      findById : jest.fn()
//     },
//     shard: {
//       create: jest.fn(),
//       findByUserId: jest.fn(),
//       getShardWithFiles: jest.fn(),
//       getFiles: jest.fn(),
//       updateFiles: jest.fn(),
//       insertFiles: jest.fn(),
//       patch: jest.fn()
//     }
//   }
// }));
// jest.mock("../../../src/repositories/cache", () => ({
//   cache: {
//     shard: {
//       removeShardPages: jest.fn(),
//       findShardsByUserId: jest.fn(),
//       saveShardsByUserId: jest.fn(),
//       getShardWithFiles: jest.fn(),
//       saveShardWithFiles: jest.fn(),
//       patchShard: jest.fn(),
//     },
//     addToDeadLetterQueue: jest.fn()
//   }
// }));
// import { db as originalDb} from "../../../src/repositories/db";
// import { cache as originalCache } from "../../../src/repositories/cache";
// import { Shard, ShardWithFiles } from "../../entities/shard";
// import { File } from "../../entities/file";
// const db = originalDb as jest.Mocked<typeof originalDb>
// const cache = originalCache as jest.Mocked<typeof originalCache>


// describe("/api/v1/shards Router", () => {
// const mockUserDetails = {
//   id: "user1",
//   createdAt: new Date(),
//   updatedAt: new Date()
// }
// const mockShards: Shard[] = [
//   {
//     id: 1,
//     title: "Untitled",
//     userId: "user1",
//     templateType: "react",
//     mode: "normal",
//     type: "public",
//     lastSyncTimestamp: new Date(),
//     createdAt: new Date(),
//     updatedAt: new Date()
//   }
// ];

// const mockShardWithFiles = {
//   id: 1,
//   title: "Test Room",
//   userId: "user1",
//   templateType: "react",
//   mode: "normal",
//   type: "public",
//   lastSyncTimestamp: new Date(),
//   createdAt: new Date(),
//   updatedAt: new Date(),
//   files: [
//     { id: 1, code: 'TEST123', name: 'test.txt', shardId: 1 },
//     { id: 2, code: 'TEST456', name: 'example.doc', shardId: 1 }
//   ]
// };

// const mockFiles = [
//   { id: 1, code: 'TEST123', name: 'test.txt', shardId: 1 },
//   { id: 2, code: 'TEST456', name: 'example.doc', shardId: 1 }
// ] as File[];

// beforeEach(() => {
//   // Reset all mocks before each test
//   jest.clearAllMocks();
// });

//   describe("/api/v1/shards POST createShard", () => {
//     //protected route
//     beforeEach(()=> {
//       db.user.findById.mockResolvedValue(mockUserDetails);
//     })

//     it("should return status code 400 if bearer token not found", async ()=> {
//       const response = await request(app)
//       .post("/api/v1/shards")     
//       expect(response.status).toBe(400);
//     })

//     it("should return status code 422 if body is not valid", async () => {
//       const response = await request(app)
//       .post("/api/v1/shards")
//       .set("Accept", "application/json")
//       .set("Content-Type", "application/json")
//       .send({templateType: "golang",  type: "normal"}) // mode not present,normal not valid shard type, golang not valid templateType 
//       .auth("user1", {type: "bearer"})

//       expect(response.status).toBe(422);
//     })
//     it("should return status code 500 if data could not be saved", async ()=> {
//       db.shard.create.mockResolvedValue(null);
//       const response = await request(app)
//       .post("/api/v1/shards")
//       .set("Accept", "application/json")
//       .set("Content-Type", "application/json")
//       .send({templateType: "react", mode: "normal", type: "public"})
//       .auth("user1", {type: "bearer"})
//       expect(response.status).toBe(500);
//     })

//     it("should return status code 200 if data saved successfully", async ()=> {
//       db.shard.create.mockResolvedValue(mockShards);
//       const response = await request(app)
//       .post("/api/v1/shards")
//       .set("Accept", "application/json")
//       .set("Content-Type", "application/json")
//       .send({templateType: "react", mode: "normal", type: "public"})
//       .auth("user1", {type: "bearer"})
//       expect(response.status).toBe(200);
//     })

//     it("should have successful cache invalidation after db mutation", async ()=> {
//       db.shard.create.mockResolvedValue(mockShards);
//       cache.shard.removeShardPages.mockResolvedValue("OK");
//       const response = await request(app)
//       .post("/api/v1/shards")
//       .set("Accept", "application/json")
//       .set("Content-Type", "application/json")
//       .send({templateType: "react", mode: "normal", type: "public"})
//       .auth("user1", {type: "bearer"})
//       expect(response.status).toBe(200);
//       expect(db.shard.create).toHaveBeenCalledWith({
//         title: "Untitled",
//         userId: "user1",
//         templateType: "react",
//         mode:"normal",
//         type: "public"
//       })
//       expect(cache.shard.removeShardPages).toHaveBeenCalledWith("user1");
//       expect(cache.addToDeadLetterQueue).not.toHaveBeenCalled();
//     })

//     it("append invalidation event to dlq if cache invalidation fails after db mutation", async ()=> {
//       db.shard.create.mockResolvedValue(mockShards);
//       cache.shard.removeShardPages.mockResolvedValue(null);
//       const response = await request(app)
//       .post("/api/v1/shards")
//       .set("Accept", "application/json")
//       .set("Content-Type", "application/json")
//       .send({templateType: "react", mode: "normal", type: "public"})
//       .auth("user1", {type: "bearer"})
//       expect(response.status).toBe(200);
//       expect(db.shard.create).toHaveBeenCalledWith({
//         title: "Untitled",
//         userId: "user1",
//         templateType: "react",
//         mode:"normal",
//         type: "public"
//       })
//       expect(cache.shard.removeShardPages).toHaveBeenCalledWith("user1");
//       expect(cache.addToDeadLetterQueue).toHaveBeenCalled();
//     })

//     it("should return status code 500 if append to dlq fails", async ()=> {
//       db.shard.create.mockResolvedValue(mockShards);
//       cache.shard.removeShardPages.mockResolvedValue(null);
//       cache.addToDeadLetterQueue.mockRejectedValue(null);
//       const response = await request(app)
//       .post("/api/v1/shards")
//       .set("Accept", "application/json")
//       .set("Content-Type", "application/json")
//       .send({templateType: "react", mode: "normal", type: "public"})
//       .auth("user1", {type: "bearer"})
//       expect(response.status).toBe(500);
//       expect(db.shard.create).toHaveBeenCalledWith({
//         title: "Untitled",
//         userId: "user1",
//         templateType: "react",
//         mode:"normal",
//         type: "public"
//       })
//       expect(cache.shard.removeShardPages).toHaveBeenCalledWith("user1");
//       expect(cache.addToDeadLetterQueue).toHaveBeenCalled();
//     })
//   });

//   describe("/api/v1/shards GET fetchShards", () => {
//     let limit = 10;
//     let offset = 0;
//     // protected route
//     beforeEach(()=> {
//       db.user.findById.mockResolvedValue(mockUserDetails);
//     })
//     it("should return status code 400 if bearer token not found", async () => {
//       const response = await request(app)
//       .get("/api/v1/shards")
//       expect(response.status).toBe(400);
//     })


//     it("should return status code 200 on cache hit", async ()=> {
//       // cache hit
//       cache.shard.findShardsByUserId.mockResolvedValue(mockShards);
//       const response = await request(app)
//       .get("/api/v1/shards")
//       .auth("user1", {type: "bearer"})
//       .query({limit, offset})
//       expect(response.status).toBe(200);
//       expect(cache.shard.findShardsByUserId).toHaveBeenCalledWith("user1", calculatePageNo(offset, limit));
//       expect(db.shard.findByUserId).not.toHaveBeenCalled();
//     })

//     it("should return status code 200 on db hit, cache miss", async () => {
//       // cache miss
//       cache.shard.findShardsByUserId.mockResolvedValue(null);
//       // db hit
//       db.shard.findByUserId.mockResolvedValue(mockShards);
//       const response = await request(app)
//       .get("/api/v1/shards")
//       .auth("user1", {type: "bearer"})
//       .query({limit: 10, offset: 0})
//       expect(response.status).toBe(200);
//       expect(cache.shard.findShardsByUserId).toHaveBeenCalledWith("user1", calculatePageNo(offset, limit));
//       expect(db.shard.findByUserId).toHaveBeenCalledWith("user1", limit, offset);
//     })

//     it("should return status code 500 on both cache and db miss", async ()=> {
//             // cache miss
//             cache.shard.findShardsByUserId.mockResolvedValue(null);
//             // db miss
//             db.shard.findByUserId.mockResolvedValue(null);
//             const response = await request(app)
//             .get("/api/v1/shards")
//             .auth("user1", {type: "bearer"})
//             .query({limit: 10, offset: 0})
//             expect(response.status).toBe(500);
//             expect(cache.shard.findShardsByUserId).toHaveBeenCalledWith("user1", calculatePageNo(offset, limit));
//             expect(db.shard.findByUserId).toHaveBeenCalledWith("user1", limit, offset);
//     })
//   })

//   describe("/api/v1/shards/{id} GET fetchShardById", () => {
//     // protected route
//     beforeEach(()=> {
//       db.user.findById.mockResolvedValue(mockUserDetails);
//     })

//     it("should return status code 400 if bearer token not found", async () => {
//       const response = await request(app)
//       .get("/api/v1/shards/1")
//       expect(response.status).toBe(400);
//     })

//     it("should return status code 200 on cache hit", async ()=> {
//       // cache hit
//       cache.shard.getShardWithFiles.mockResolvedValue(mockShardWithFiles as ShardWithFiles);
//       const response = await request(app)
//       .get("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       expect(response.status).toBe(200);
//       expect(cache.shard.getShardWithFiles).toHaveBeenCalledWith(1);
//       expect(db.shard.getShardWithFiles).not.toHaveBeenCalled();
//     })

//     it("should return status code 200 on db hit, cache miss", async () => {
//       // cache miss
//       cache.shard.getShardWithFiles.mockResolvedValue(null);
//       // db hit
//       db.shard.getShardWithFiles.mockResolvedValue(mockShardWithFiles as ShardWithFiles);
//       const response = await request(app)
//       .get("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       expect(response.status).toBe(200);
//       expect(cache.shard.getShardWithFiles).toHaveBeenCalledWith(1);
//       expect(db.shard.getShardWithFiles).toHaveBeenCalledWith(1);
//     })

//     it("should return status code 400 on both cache and db miss", async ()=> {
//             // cache miss
//             cache.shard.getShardWithFiles.mockResolvedValue(null);
//             // db miss
//             db.shard.getShardWithFiles.mockResolvedValue(null);
//             const response = await request(app)
//             .get("/api/v1/shards/1")
//             .auth("user1", {type: "bearer"})
//             expect(response.status).toBe(400);
//             expect(cache.shard.getShardWithFiles).toHaveBeenCalledWith(1);
//             expect(db.shard.getShardWithFiles).toHaveBeenCalledWith(1);
//     })
//   })

//   describe("/api/v1/shards/{id} PUT saveShard", () => {
//     // protected route
//     beforeEach(()=> {
//       db.user.findById.mockResolvedValue(mockUserDetails);
//     })

//     it("should return status code 400 if bearer token not found", async () => {
//       const response = await request(app)
//       .put("/api/v1/shards/1")
//       expect(response.status).toBe(400);
//     })

//     it("should return status code 422 if request body invalid", async () => {
//       const response = await request(app)
//       .put("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       .set("Accept", "application/json")
//       .set("Content-Type", "application/json")
//       .send({files: [
//          {  code: 'TEST234', name: 'test.txt' },
//         { code: 'TEST456', name: 'example.doc' }
//       ]})
//       expect(response.status).toBe(422);
//     })

//     it("should return status code 500 if could not get files by shard id", async ()=> {
//       db.shard.getFiles.mockResolvedValue(null);
//       const response = await request(app)
//       .put("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       .set("Accept","application/json")
//       .set("Content-Type", "application/json")
//       .send({files: [
//         {  code: 'TEST234', name: 'test.txt' },
//        { code: 'TEST456', name: 'example.doc' }
//      ], dependencies: []})
//       expect(response.status).toBe(500);
//       expect(db.shard.getFiles).toHaveBeenCalledWith(1);
//     })

//     it("should update the files content to the latest state from the request body, if they already exist", async ()=> {
//       db.shard.getFiles.mockResolvedValue(mockFiles);
//       db.shard.updateFiles.mockResolvedValue("OK");
//       const response = await request(app)
//       .put("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       .set("Accept","application/json")
//       .set("Content-Type", "application/json")
//       .send({files: [
//         {  code: 'TEST234', name: 'test.txt' },
//        { code: 'TEST456', name: 'example.doc' }
//      ], dependencies: []})
//       expect(response.status).toBe(200);
//       expect(db.shard.getFiles).toHaveBeenCalledWith(1);
//       expect(db.shard.updateFiles).toHaveBeenCalledWith(1, [
//         {  code: 'TEST234', name: 'test.txt' },
//        { code: 'TEST456', name: 'example.doc' }
//      ]);
//     })
   
//     it("should return status code 500, if it were unable to update the files content to the latest state from the request body", async ()=> {
//       db.shard.getFiles.mockResolvedValue(mockFiles);
//       db.shard.updateFiles.mockResolvedValue(null);
//       const response = await request(app)
//       .put("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       .set("Accept","application/json")
//       .set("Content-Type", "application/json")
//       .send({files: [
//         {  code: 'TEST234', name: 'test.txt' },
//        { code: 'TEST456', name: 'example.doc' }
//      ], dependencies: []})
//       expect(response.status).toBe(500);
//       expect(db.shard.getFiles).toHaveBeenCalledWith(1);
//       expect(db.shard.updateFiles).toHaveBeenCalledWith(1, [
//         {  code: 'TEST234', name: 'test.txt' },
//        { code: 'TEST456', name: 'example.doc' }
//      ]);
//      expect(db.shard.insertFiles).not.toHaveBeenCalled();
//     })

//     it("should insert the files from the request body for the first time, if they don't exist", async ()=> {
//       db.shard.getFiles.mockResolvedValue([]);
//       db.shard.insertFiles.mockResolvedValue("OK");
//       const response = await request(app)
//       .put("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       .set("Accept","application/json")
//       .set("Content-Type", "application/json")
//       .send({files: [
//         {  code: 'TEST234', name: 'test.txt' },
//        { code: 'TEST456', name: 'example.doc' }
//      ], dependencies: []})
//       expect(response.status).toBe(200);
//       expect(db.shard.getFiles).toHaveBeenCalledWith(1);
//       expect(db.shard.updateFiles).not.toHaveBeenCalled();
//      expect(db.shard.insertFiles).toHaveBeenCalledWith(1, [
//       {  code: 'TEST234', name: 'test.txt' },
//      { code: 'TEST456', name: 'example.doc' }
//    ]);
//     })
//   })

//   describe("/api/v1/shards/{id} PATCH updateShard", () => {
//     // protected route
//     beforeEach(()=> {
//       db.user.findById.mockResolvedValue(mockUserDetails);
//     })

//     it("should return status code 400 if bearer token not found", async () => {
//       const response = await request(app)
//       .patch("/api/v1/shards/1")
//       expect(response.status).toBe(400);
//     })

//     it("should return status code 500 if db mutation failed", async ()=> {
//       db.shard.patch.mockResolvedValue(null);
//       const response = await request(app)
//       .patch("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       .query({title: "Hi", type: "private"})
//       expect(response.status).toBe(500);
//       expect(db.shard.patch).toHaveBeenCalledWith({
//         userId: "user1",
//         type: "private",
//         title: "Hi"
//       });
//       expect(cache.shard.patchShard).not.toHaveBeenCalled();
//     })

//     it("should return status code 200 on successful cache invalidation", async () => {
//       // cache miss
//       db.shard.patch.mockResolvedValue("OK");
//       cache.shard.patchShard.mockResolvedValue("OK");
//       const response = await request(app)
//       .patch("/api/v1/shards/1")
//       .auth("user1", {type: "bearer"})
//       .query({title: "Hi", type: "private"})
//       expect(response.status).toBe(200);
//       expect(db.shard.patch).toHaveBeenCalledWith({
//         userId: "user1",
//         type: "private",
//         title: "Hi"
//       });
//       expect(cache.shard.patchShard).toHaveBeenCalledWith(1, {
//         userId: "user1",
//         type: "private",
//         title: "Hi"
//       })
//     })

  
//   })
// });
