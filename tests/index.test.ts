import supertest from "supertest";
import app from "../src/app";

const request = supertest(app);

test("Should return status 200", () => {
  return request.get("/").expect(200, "OK");
});
