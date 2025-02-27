import { json, urlencoded } from "body-parser";
import { Express, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";

interface MessageParams extends Record<string, string> {
  name: string;
}

export function setupServer(app: Express) {
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .get<MessageParams>(
      "/message/:name",
      (req: Request, res: Response): void => {
        res.json({ message: `hello ${req.params.name}` });
      },
    )
    .get("/healthz", (_: Request, res: Response): void => {
      res.json({ ok: true });
    });

  return app;
}
