import {
  ContainerNode,
  IContainer,
  JSONObject,
  NodeBase,
  WebServer,
} from "@ts-flow/core";

export interface ISlackEventsListener {
  onEvent(payload: JSONObject): void;
}

@ContainerNode
export class SlackEventsEndpoint extends NodeBase {
  private listeners: ISlackEventsListener[] = [];

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    const endpoint = config["eventsEndpoint"] as string;
    const webServer = this.container.getInstance("WebServer") as WebServer;
    webServer.addPostEndpoint(endpoint, (req, res) => {
      console.log("slack events endpoint", req.body);
      const form = req.body as Record<string, string>;
      const type = form["type"];
      if ("url_verification" === type) {
        //TODO add real verification
        res.status(200).send(form["challenge"]);
        return;
      } else {
        const payload = req.body as JSONObject;
        this.listeners.forEach((listener) => {
          listener.onEvent(payload);
        });
      }
      res.sendStatus(200);
    });
  }

  public addListener(listener: ISlackEventsListener): void {
    this.listeners.push(listener);
  }
}
