import { ContainerNode, IContainer, JSONObject, NodeBase } from "../Container";
import { EventBus } from "./EventBus";
import { WebServer } from "./WebServer";
import { Request, Response } from "express";

@ContainerNode
export class Endpoint extends NodeBase {
  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    const webServer = this.container.getInstance("WebServer") as WebServer;
    const eventBus = this.container.getInstance("EventBus") as EventBus;
    const endpointPath = config["path"] as string;
    const endpointType = config["type"] as string;
    const eventName = config["eventName"] as string;
    if (endpointType === "post") {
      webServer.addPostEndpoint(endpointPath, (req: Request, res: Response) => {
        const data: JSONObject = req.body as JSONObject;
        eventBus.sendEvent(eventName, data);
        res.sendStatus(200);
      });
    } else if (endpointType === "get") {
      webServer.addGetEndpoint(endpointPath, (req: Request, res: Response) => {
        eventBus.sendEvent(eventName, { ...req.params });
        res.sendStatus(200);
      });
    }
  }
}
