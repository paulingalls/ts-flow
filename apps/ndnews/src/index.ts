import { IContainer, bootstrap } from "@ai-flow/core";
import path from "path";
import ndFlow from "./send-daily-nd-summary.json";

const paths: string[] = [];
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'ai', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'api', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'cron', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'puppeteer', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'slack', 'dist'))
console.log(paths);

void bootstrap(paths, (container: IContainer) => {
  container.createInstance(ndFlow.id, ndFlow.type, ndFlow.config);
})