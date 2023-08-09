import { setupServer } from "./server";
import { IContainer, bootstrap } from '@ai-flow/core';
import { WebServer } from '@ai-flow/core';
import { Express, Request, Response } from 'express';
import { log } from "@ai-flow/logger";

void bootstrap([], (container: IContainer) => {
  container.createInstance('EventBus', 'EventBus', { devMode: 'true' });
  
  const port  = process.env.PORT || 5001;
  const webServer: WebServer = container.createInstance('WebServer', 'WebServer', { port }) as WebServer;
  const app: Express | null = webServer.getApp();
  if (app) {
    setupServer(app);

    webServer.addGetEndpoint('/instances', (req: Request, res: Response) => {
      res.send(container.getInstances().map((instance) => instance.getId()).reduce((prev, cur) => prev += '\n' + cur));
    });

    webServer.addGetEndpoint('/nodes', (req: Request, res: Response) => {
      res.send(container.getNodeNames().reduce((prev, cur) => prev += '\n' + cur));
    });

    webServer.startServer();
    log('started server');
  }
});