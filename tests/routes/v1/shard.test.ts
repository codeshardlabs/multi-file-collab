import request from "supertest";
import { app } from "../../../src/app";
import { jest } from '@jest/globals';
jest.mock("../../../src/repositories/db", () => ({
  db: {
    user: {
     findById : jest.fn()
    },
    shard: {
      create: jest.fn()
    }
  }
}));
jest.mock("../../../src/repositories/cache", () => ({
  cache: {
    shard: {
      removeShardPages: jest.fn()
    },
    addToDeadLetterQueue: jest.fn()
  }
}));
import { db as originalDb} from "../../../src/repositories/db";
import { cache as originalCache } from "../../../src/repositories/cache";
import { Shard } from "../../entities/shard";
const db = originalDb as jest.Mocked<typeof originalDb>
const cache = originalCache as jest.Mocked<typeof originalCache>


describe("/api/v1/shards Router", () => {
const mockUserDetails = {
  id: "user1",
  createdAt: new Date(),
  updatedAt: new Date()
}
const mockShards: Shard[] = [
  {
    id: 1,
    title: "Untitled",
    userId: "user1",
    templateType: "react",
    mode: "normal",
    type: "public",
    lastSyncTimestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

  describe("/api/v1/shards POST createShard", () => {
    //protected route
    beforeEach(()=> {
      db.user.findById.mockResolvedValue(mockUserDetails);
    })

    it("should return status code 400 if bearer token not found", async ()=> {
      const response = await request(app)
      .post("/api/v1/shards")     
      expect(response.status).toBe(400);
    })

    it("should return status code 422 if body is not valid", async () => {
      const response = await request(app)
      .post("/api/v1/shards")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send({templateType: "golang",  type: "normal"}) // mode not present,normal not valid shard type, golang not valid templateType 
      .auth("user1", {type: "bearer"})

      expect(response.status).toBe(422);
    })
    it("should return status code 500 if data could not be saved", async ()=> {
      db.shard.create.mockResolvedValue(null);
      const response = await request(app)
      .post("/api/v1/shards")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send({templateType: "react", mode: "normal", type: "public"})
      .auth("user1", {type: "bearer"})
      expect(response.status).toBe(500);
    })

    it("should return status code 200 if data saved successfully", async ()=> {
      db.shard.create.mockResolvedValue(mockShards);
      const response = await request(app)
      .post("/api/v1/shards")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send({templateType: "react", mode: "normal", type: "public"})
      .auth("user1", {type: "bearer"})
      expect(response.status).toBe(200);
    })

    it("should have successful cache invalidation after db mutation", async ()=> {
      db.shard.create.mockResolvedValue(mockShards);
      cache.shard.removeShardPages.mockResolvedValue("OK");
      const response = await request(app)
      .post("/api/v1/shards")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send({templateType: "react", mode: "normal", type: "public"})
      .auth("user1", {type: "bearer"})
      expect(response.status).toBe(200);
      expect(db.shard.create).toHaveBeenCalledWith({
        title: "Untitled",
        userId: "user1",
        templateType: "react",
        mode:"normal",
        type: "public"
      })
      expect(cache.shard.removeShardPages).toHaveBeenCalledWith("user1");
      expect(cache.addToDeadLetterQueue).not.toHaveBeenCalled();
    })

    it("append invalidation event to dlq if cache invalidation fails after db mutation", async ()=> {
      db.shard.create.mockResolvedValue(mockShards);
      cache.shard.removeShardPages.mockResolvedValue(null);
      const response = await request(app)
      .post("/api/v1/shards")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send({templateType: "react", mode: "normal", type: "public"})
      .auth("user1", {type: "bearer"})
      expect(response.status).toBe(200);
      expect(db.shard.create).toHaveBeenCalledWith({
        title: "Untitled",
        userId: "user1",
        templateType: "react",
        mode:"normal",
        type: "public"
      })
      expect(cache.shard.removeShardPages).toHaveBeenCalledWith("user1");
      expect(cache.addToDeadLetterQueue).toHaveBeenCalled();
    })

    it("should return status code 500 if append to dlq fails", async ()=> {
      db.shard.create.mockResolvedValue(mockShards);
      cache.shard.removeShardPages.mockResolvedValue(null);
      cache.addToDeadLetterQueue.mockRejectedValue(null);
      const response = await request(app)
      .post("/api/v1/shards")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send({templateType: "react", mode: "normal", type: "public"})
      .auth("user1", {type: "bearer"})
      expect(response.status).toBe(500);
      expect(db.shard.create).toHaveBeenCalledWith({
        title: "Untitled",
        userId: "user1",
        templateType: "react",
        mode:"normal",
        type: "public"
      })
      expect(cache.shard.removeShardPages).toHaveBeenCalledWith("user1");
      expect(cache.addToDeadLetterQueue).toHaveBeenCalled();
    })
  });

 

});
