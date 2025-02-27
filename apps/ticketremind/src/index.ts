import { bootstrap, IContainer, JSONObject } from "@ts-flow/core";
import path from "path";
import reminders from "./jira-ticket-reminders.json";
import dotenv from "dotenv";

dotenv.config();

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
  path.join(__dirname, "..", "node_modules", "@ts-flow", "slack", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "transforms", "dist"),
);

void bootstrap(paths, (container: IContainer) => {
  container.createInstance(
    reminders.id,
    reminders.type,
    reminders.config as unknown as JSONObject,
  );
});
