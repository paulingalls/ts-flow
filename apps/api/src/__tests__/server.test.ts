import supertest, { Response } from "supertest";
import express, { Express } from 'express';
import { setupServer } from "../server";

describe("server", () => {
  it("health check returns 200", async () => {
    const app: Express = express();
    setupServer(app);
    await supertest(app)
      .get("/healthz")
      .expect(200)
      .then((res: Response) => {
        expect((res.body as {ok: boolean}).ok).toBe(true);
      });
  });

  it("message endpoint says hello", async () => {
    const app: Express = express();
    setupServer(app);
    await supertest(app)
      .get("/message/jared")
      .expect(200)
      .then((res: Response) => {
        expect(res.body).toEqual({ message: "hello jared" });
      });
  });
});
