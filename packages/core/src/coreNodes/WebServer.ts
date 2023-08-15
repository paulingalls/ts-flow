import { ContainerNode, IContainer, NodeBase, JSONObject } from "../Container";
import express, { Express, Request, Response } from 'express';

@ContainerNode
export class WebServer extends NodeBase {
  private app: Express;
  private port: number = 3002;
  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.app = express();
    this.app.use(express.json());
    const port = config['port'];
    if (typeof port === 'string') {
      this.port = parseInt(port);
    }
  }

  getApp(): Express {
    return this.app;
  }

  addGetEndpoint(path: string, method: (req: Request, res: Response) => void) {
    console.log('adding get endpoint', path);
    this.app.get(path, method);
  }

  addPostEndpoint(path: string, method: (req: Request, res: Response) => void) {
    console.log('adding post endpoint', path);
    this.app.post(path, method);
  }

  startServer() {
    this.app.listen(this.port, () => {
      console.log('webserver listening on port', this.port);
    })
  }
}