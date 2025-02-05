import request from "supertest";
import { app } from "../../../src/app";

describe("/users Router", () => {

  describe("/users POST saveUserMetadata", () => {
    it("should return status code 400 if id not found in the request body", (done) => {
      request(app)
      .post("/users")
      .set("Accept", "application/json")
      .expect(400, done);
    })

    it("should return status code 201 if data saved successfully", (done) => {
      request(app)
      .post("/users")
      .expect(201, done);
    })
  });

  describe("/users/{id} GET getUserInfo", () => {
    // protected route
    it("should return status code 400 if id params not found", (done) => {
    request(app)
    .get("/users")
    .expect(400, done);
    });

    it("should return status code 400 if invalid user id", async () => {
    const response = await request(app)
    .get("/users/{fake_user_id}")
    expect(response.status).toBe(400);
    expect(response.headers["Content-Type"]).toMatch(/json/);
    expect(response.body?.data).toBeNull();
    });

    it("should return status code 200 and user info. on valid user id", async () => {
     const response =  await request(app)
      .get("/users/{actual_user_id}")
      expect(response.headers["Content-Type"]).toMatch(/json/);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.user?.id).toBe("{actual_user_id}");
    });
  });

});
