import request from "supertest";
import { app } from "../../../src/app";

describe("/users Router", () => {

  describe("/users POST saveUserMetadata", () => {
    it("should return status code 400 if id not found in the request body", async () => {
      const response = await request(app)
      .post("/api/v1/users")
      .set("Accept", "application/json");

      expect(response.statusCode).toBe(400);
    })

    it("should return status code 201 if data saved successfully", async () => {
     const response = await request(app)
      .post("/api/v1/users")
      .set("Accept", "application/json");

      expect(response.statusCode).toBe(201);
    })
  });

  describe("/users/{id} GET getUserInfo", () => {
    // protected route
    it("should return status code 400 if id params not found", async () => {
    const response = await request(app)
    .get("/api/v1/users");
    
    expect(response.statusCode).toBe(400);
    });

    it("should return status code 400 if invalid user id", async () => {
    const response = await request(app)
    .get("/api/v1/users/{fake_user_id}")
    expect(response.status).toBe(400);
    expect(response.headers["Content-Type"]).toMatch(/json/);
    expect(response.body?.data).toBeNull();
    });

    it("should return status code 200 and user info. on valid user id", async () => {
     const response =  await request(app)
      .get("/api/v1/users/{actual_user_id}")
      expect(response.headers["Content-Type"]).toMatch(/json/);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.user?.id).toBe("{actual_user_id}");
    });
  });

});
