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
    it("should return status code 400 if id not found in the request body", async () => {
      const response = await request(app)
      .post("/api/v1/comments")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")  

      expect(response.statusCode).toBe(400);
    })

    it("should return status code 201 if data saved successfully", async () => {
      db.user.onboard.mockResolvedValue(mockUserDetails);
     const response = await request(app)
      .post("/api/v1/users")
      .send({id: "user1"}) // req.body 
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")

      expect(response.statusCode).toBe(201);
      expect(JSON.stringify(response.body.data.user)).toBe(JSON.stringify(mockUserDetails))
    })

    it("should return status 500 if data could not be saved successfully", async ()=> {
      // db save failure
      db.user.onboard.mockResolvedValue(null);
      const response = await request(app)
      .post("/api/v1/users")
      .send({id: "user1"}) // req.body 
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      
      expect(response.status).toBe(500);
      expect(response.error).not.toBeNull();
      
    })
  });

});
