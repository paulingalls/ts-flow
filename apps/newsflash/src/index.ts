import { IContainer, bootstrap, WebServer, JSONObject } from "@ai-flow/core";
import path from "path";
import newsFlash from "./news-flash.json";
import { Request, Response } from "express";
import dotenv from "dotenv"

dotenv.config();

const paths: string[] = [];
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'ai', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'api', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'puppeteer', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'slack', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'transforms', 'dist'))

void bootstrap(paths, (container: IContainer) => {
  const webServer = container.getInstance('WebServer') as WebServer;
  webServer.addGetEndpoint('/instances', (req: Request, res: Response) => {
    res.send(container.getInstances().map((instance) => instance.getId()).reduce((prev, cur) => prev += '\n' + cur));
  });
  container.createInstance(newsFlash.id, newsFlash.type, newsFlash.config as unknown as JSONObject);

  webServer.startServer();
})