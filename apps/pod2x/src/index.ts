import { IContainer, bootstrap, EventBus, JSONObject } from '@ai-flow/core';
import { WebServer } from '@ai-flow/core';
import express, { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import podcast2X from './create-posts-from-podcast.json';

// Configure Multer to handle file uploads
const storage = multer.memoryStorage(); // Store the uploaded file in memory as a Buffer
const upload = multer({ storage });
const paths: string[] = [];
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'ai', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'slack', 'dist'))
paths.push(path.join(__dirname, '..', 'node_modules', '@ai-flow', 'transforms', 'dist'))


void bootstrap(paths, (container: IContainer) => {
  const eventBus: EventBus = container.getInstance('EventBus') as EventBus;
  const webServer: WebServer = container.getInstance('WebServer') as WebServer;
  const app: Express | null = webServer.getApp();
  if (app) {
    app.use(express.static('public'))

    app.post('/start', upload.single('file'), (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileBuffer: Buffer = req.file.buffer;
      eventBus.sendEvent('podcastUploaded', {fileBuffer: fileBuffer as unknown as string})

      res.status(200).json({ message: 'File data loaded into Buffer successfully' });
    });

    container.createInstance(podcast2X.id, podcast2X.type, podcast2X.config as unknown as JSONObject);

    webServer.startServer();
    console.log('started server');
  }
});