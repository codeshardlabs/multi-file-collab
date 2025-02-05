import request from "supertest";
import { app } from "../../../src/app";

describe("/users Router", () => {

  describe("/users POST saveUserMetadata", () => {
  });

  describe("/users/{id} GET getUserInfo", () => {
    // protected route
    it("should return status code 400 if id params not found", (done) => {
    request(app)
    .get("/users")
    .expect(400, done);
    });

    it("should populate user id as a custom property to the express request", () => {
    });
    it("should return status code 400 if invalid user id", (done) => {
    request(app)
    .get("/users/{fake_user_id}")
    .expect(400, done);
    });

    it("should return status code 200 and user info. on valid user id", (done) => {
      request(app)
      .get("/users/{actual_user_id}")
      .expect(200, done);
    });
  });

});
