import supertest, { Response } from "supertest";
import express, { Express } from "express";
import { setupServer } from "../server";
import { App } from "supertest/types";

describe("server", () => {
  it("health check returns 200", (done) => {
    const app: Express = express();
    setupServer(app);
    supertest(app as App)
      .get("/healthz")
      .expect(200)
      .then((res: Response) => {
        expect((res.body as { ok: boolean }).ok).toBe(true);
        done();
      })
      .catch(done);
  });

  it("message endpoint says hello", (done) => {
    const app: Express = express();
    setupServer(app);
    supertest(app as App)
      .get("/message/jared")
      .expect(200)
      .then((res: Response) => {
        expect(res.body).toEqual({ message: "hello jared" });
        done();
      })
      .catch(done);
  });
});
