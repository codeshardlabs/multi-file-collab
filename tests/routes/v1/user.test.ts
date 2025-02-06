import request from "supertest";
import { app } from "../../../src/app";
import { jest } from '@jest/globals';
jest.mock("../../../src/repositories/db", () => ({
  db: {
    user: {
      onboard: jest.fn(),
      findByIdWithFollowersList: jest.fn()
    }
  }
}));
jest.mock("../../../src/repositories/cache", () => ({
  cache: {
    user: {
      saveUserInfo: jest.fn(),
      getUserInfo: jest.fn()
    }
  }
}));
import { db as originalDb} from "../../../src/repositories/db";
import { cache as originalCache } from "../../../src/repositories/cache";
import { UserWithFollowersAndFollowering } from "../../entities/user";
const db = originalDb as jest.Mocked<typeof originalDb>
const cache = originalCache as jest.Mocked<typeof originalCache>


describe("/users Router", () => {
const mockUserDetails = {
  id: "user1",
  createdAt: new Date(),
  updatedAt: new Date()
}
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

  describe("/users POST saveUserMetadata", () => {
    // public route
    it("should return status code 400 if id not found in the request body", async () => {
      const response = await request(app)
      .post("/api/v1/users")
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

  describe("api/v1/users/{id} GET getUserInfo", () => {
    const mockUserDetails = {
      id: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      followers: [],
      following: []
    }
    // cache hit
    it("should return valid user from cache", async () => {
      cache.user.getUserInfo.mockResolvedValue(mockUserDetails);
      const response = await request(app)
      .get("/api/v1/users/user1")

      expect(response.status).toBe(200);
      expect(JSON.stringify(response.body.data.user)).toBe(JSON.stringify(mockUserDetails));
      expect(cache.user.getUserInfo).toHaveBeenCalledWith("user1")
    });

    it("should return valid user from db hit after cache miss", async () => {
      cache.user.getUserInfo.mockResolvedValue(null);
      db.user.findByIdWithFollowersList.mockResolvedValue(mockUserDetails);
      cache.user.saveUserInfo.mockResolvedValue("OK");

      const response = await request(app)
      .get("/api/v1/users/user1")

      expect(response.status).toBe(200);
      expect(cache.user.getUserInfo).toHaveBeenCalled();
      expect(db.user.findByIdWithFollowersList).toHaveBeenCalledWith("user1")
      expect(cache.user.saveUserInfo).toHaveBeenCalledWith(mockUserDetails as UserWithFollowersAndFollowering)
    })

    it("should return status code 500 in case of db and cache miss", async ()=> {
      cache.user.getUserInfo.mockResolvedValue(null);
      db.user.findByIdWithFollowersList.mockResolvedValue(null);

      const response = await request(app)
      .get("/api/v1/users/user1")

      expect(response.status).toBe(400);
      expect(cache.user.getUserInfo).toHaveBeenCalledWith("user1");
      expect(db.user.findByIdWithFollowersList).toHaveBeenCalledWith("user1");
    })

  });

});
