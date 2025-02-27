import {
  bootstrap,
  EventBus,
  IContainer,
  JSONObject,
  WebServer,
} from "@ts-flow/core";
import express, { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import podcast2X from "./create-posts-from-podcast.json";
import dotenv from "dotenv";
import { nanoid } from "nanoid";
import { promises as fs } from "fs";

dotenv.config();

// Configure Multer to handle file uploads
const storage = multer.memoryStorage(); // Store the uploaded file in memory as a Buffer
const upload = multer({ storage });
const paths: string[] = [];
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "ai", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "ffmpeg", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "slack", "dist"),
);
paths.push(
  path.join(__dirname, "..", "node_modules", "@ts-flow", "transforms", "dist"),
);

void bootstrap(paths, (container: IContainer) => {
  const eventBus: EventBus = container.getInstance("EventBus") as EventBus;
  const webServer: WebServer = container.getInstance("WebServer") as WebServer;
  const app: Express | null = webServer.getApp();
  if (app) {
    app.use(express.static("public"));

    app.post(
      "/start",
      upload.single("file"),
      async (req: Request, res: Response) => {
        if (!req.file) {
          res.status(400).json({ error: "No file uploaded" });
          return;
        }

        const fileBuffer: Buffer = req.file.buffer;
        const extension = path.extname(req.file.originalname);
        const localPath = path.join(
          process.cwd(),
          "uploads",
          `${nanoid()}${extension}`,
        );

        try {
          await fs.writeFile(localPath, fileBuffer);
          console.log("wrote file", localPath);
          eventBus.sendEvent("podcastUploaded", { filePath: localPath });
          res
            .status(200)
            .json({ message: "File data loaded into Buffer successfully" });
        } catch (e) {
          console.log("error", e);
          res.status(500).json({ message: e });
        }
      },
    );
    container.createInstance(
      podcast2X.id,
      podcast2X.type,
      podcast2X.config as unknown as JSONObject,
    );

    webServer.startServer();
    console.log("started server");
  }
});
