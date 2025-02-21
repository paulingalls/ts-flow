import { IContainer, bootstrap, EventBus, JSONObject, JSONValue } from '@ts-flow/core';
import { WebServer } from '@ts-flow/core';
import express, { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import podcast2X from './create-posts-from-podcast.json';
import dotenv from "dotenv"

dotenv.config();

// Configure Multer to handle file uploads
const storage = multer.memoryStorage(); // Store the uploaded file in memory as a Buffer
const upload = multer({ storage });
const paths: string[] = [];
paths.push(path.join(__dirname, '..', 'node_modules', '@ts-flow', 'ai', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ts-flow', 'ffmpeg', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ts-flow', 'slack', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ts-flow', 'transforms', 'dist'))


void bootstrap(paths, (container: IContainer) => {
  const eventBus: EventBus = container.getInstance('EventBus') as EventBus;
  const webServer: WebServer = container.getInstance('WebServer') as WebServer;
  const app: Express | null = webServer.getApp();
  if (app) {
    app.use(express.static('public'))

    app.post('/start', upload.single('file'), (req: Request, res: Response) => {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const fileBuffer: Buffer = req.file.buffer;
      eventBus.sendEvent('podcastUploaded', {fileBuffer: fileBuffer as unknown as JSONValue})

      res.status(200).json({ message: 'File data loaded into Buffer successfully' });
    });

    container.createInstance(podcast2X.id, podcast2X.type, podcast2X.config as unknown as JSONObject);

    webServer.startServer();
    console.log('started server');
  }
});
