import request from "supertest";
import { app } from "../../../src/app";
import { jest } from '@jest/globals';
jest.mock("../../../src/repositories/db", () => ({
  db: {
    user: {
      onboard: jest.fn()
    }
  }
}));
import { db as originalDb} from "../../../src/repositories/db";
const db = originalDb as jest.Mocked<typeof originalDb>

describe("/users Router", () => {
const mockUserDetails = {
  id: "1",
  createdAt: new Date(),
  updatedAt: new Date()
}
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
      .send({id: "1"}) // req.body 
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
      .send({id: "1"}) // req.body 
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      
      expect(response.status).toBe(500);
      expect(response.error).not.toBeNull();
      
    })
  });

  // describe("/users/{id} GET getUserInfo", () => {
  //   // protected route
  //   it("should return status code 400 if id params not found", async () => {
  //   const response = await request(app)
  //   .get("/api/v1/users");
    
  //   expect(response.statusCode).toBe(400);
  //   });

  //   it("should return status code 400 if invalid user id", async () => {
  //   const response = await request(app)
  //   .get("/api/v1/users/{fake_user_id}")
  //   expect(response.status).toBe(400);
  //   expect(response.headers["Content-Type"]).toMatch(/json/);
  //   expect(response.body?.data).toBeNull();
  //   });

  //   it("should return status code 200 and user info. on valid user id", async () => {
  //    const response =  await request(app)
  //     .get("/api/v1/users/{actual_user_id}")
  //     expect(response.headers["Content-Type"]).toMatch(/json/);
  //     expect(response.status).toBe(200);
  //     expect(response.body?.error).toBeNull();
  //     expect(response.body?.user?.id).toBe("{actual_user_id}");
  //   });
  // });

});
