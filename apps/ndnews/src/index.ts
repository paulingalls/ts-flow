import { bootstrap, IContainer, JSONObject, WebServer } from "@ts-flow/core";
import path from "path";
import ndFlow from "./send-daily-nd-summary.json";
import { Request, Response } from "express";

const paths: string[] = [];
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "ai", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "api", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "cron", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "puppeteer", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "slack", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "transforms", "dist"),
);

void bootstrap(paths, (container: IContainer) => {
  const webServer = container.getInstance("WebServer") as WebServer;
  webServer.addGetEndpoint("/instances", (req: Request, res: Response) => {
    res.send(
      container
        .getInstances()
        .map((instance) => instance.getId())
        .reduce((prev, cur) => prev + "\n" + cur),
    );
  });
  container.createInstance(
    ndFlow.id,
    ndFlow.type,
    ndFlow.config as unknown as JSONObject,
  );

  webServer.startServer();
});
