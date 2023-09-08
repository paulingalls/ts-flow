import { IContainer, bootstrap, JSONObject } from "@ai-flow/core";
import path from "path";
import reminders from "./jira-ticket-reminders.json";
import dotenv from 'dotenv';

dotenv.config();

const paths: string[] = [];
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'ai', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'api', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'cron', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'slack', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'transforms', 'dist'))

void bootstrap(paths, (container: IContainer) => {
  container.createInstance(reminders.id, reminders.type, reminders.config as unknown as JSONObject);
})