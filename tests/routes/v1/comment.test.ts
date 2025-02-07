import request from "supertest";
import { app } from "../../../src/app";
import { jest } from '@jest/globals';
jest.mock("../../../src/repositories/db", () => ({
  db: {
    user: {
      findById: jest.fn(),
    },
    shard: {
        deleteComment: jest.fn()
    }
  }
}));
jest.mock("../../../src/repositories/cache", () => ({
  cache: {
    shard: {
        removeCommentPages: jest.fn()
    },
    addToDeadLetterQueue: jest.fn()
  }
}));
import { db as originalDb} from "../../../src/repositories/db";
import { cache as originalCache } from "../../../src/repositories/cache";
const db = originalDb as jest.Mocked<typeof originalDb>
const cache = originalCache as jest.Mocked<typeof originalCache>


describe("/api/v1/comments Router", () => {
const mockUserDetails = {
  id: "user1",
  createdAt: new Date(),
  updatedAt: new Date()
}

beforeEach(() => {
  jest.clearAllMocks();
});

  describe("api/v1/comments/{commentId} DELETE", () => {
      // protected route
    beforeEach(()=> {
        db.user.findById.mockResolvedValue(mockUserDetails);
    })
    it("should return status code 400 if bearer token not present", async ()=> {
      const response = await request(app)
      .delete("/api/v1/comments")
      expect(response.statusCode).toBe(400);
    })
   

    it("should return status code 400 if shardId not found in the request body", async () => {
      const response = await request(app)
      .delete("/api/v1/comments/1")
      .auth("user1", {type:"bearer"})

      
      console.log(response.error)
      console.log(response.body.error)
      expect(response.statusCode).toBe(400);
    })

    it("should return status code 500 if data could not be saved to db", async () => {
      db.shard.deleteComment.mockResolvedValue(null);
     const response = await request(app)
      .delete("/api/v1/comments/1")
      .auth("user1", {type:"bearer"})
      .send({shardId: 1}) // req.body
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")

      expect(response.status).toBe(500);
      expect(db.shard.deleteComment).toHaveBeenCalledWith(1);
    })

    it("should return status code 200 and commentId in the result", async () => {
      db.shard.deleteComment.mockResolvedValue("OK");
      cache.shard.removeCommentPages.mockResolvedValue("OK");
      const response = await request(app)
      .delete("/api/v1/comments/1")
      .auth("user1", {type:"bearer"})
      .send({shardId: 1}) // req.body
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")

      console.log(response.error)
      console.log(response.body.error)
      expect(response.status).toBe(200);
      expect(db.shard.deleteComment).toHaveBeenCalledWith(1); 
      expect(cache.shard.removeCommentPages).toHaveBeenCalledWith(1);
      expect(cache.addToDeadLetterQueue).toHaveBeenCalled();

    })

  });

});
