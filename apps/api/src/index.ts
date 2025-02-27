import { setupServer } from "./server";
import { bootstrap, IContainer, WebServer } from "@ts-flow/core";
import { Express, Request, Response } from "express";

void bootstrap([], (container: IContainer) => {
  container.createInstance("EventBus", "EventBus", { devMode: "true" });

  const port = process.env.PORT || 5001;
  const webServer: WebServer = container.createInstance(
    "WebServer",
    "WebServer",
    { port },
  ) as WebServer;
  const app: Express | null = webServer.getApp();
  if (app) {
    setupServer(app);

    webServer.addGetEndpoint("/instances", (req: Request, res: Response) => {
      res.send(
        container
          .getInstances()
          .map((instance) => instance.getId())
          .reduce((prev, cur) => prev + "\n" + cur),
      );
    });

    webServer.addGetEndpoint("/nodes", (req: Request, res: Response) => {
      res.send(
        container.getNodeNames().reduce((prev, cur) => prev + "\n" + cur),
      );
    });

    webServer.startServer();
    console.log("started server");
  }
});
