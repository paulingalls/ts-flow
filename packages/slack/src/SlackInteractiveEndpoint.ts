import { ContainerNode, IContainer, JSONObject, NodeBase, WebServer } from '@ai-flow/core';

export interface ISlackInteractiveListener {
  onInteraction(payload: JSONObject): void;
}
@ContainerNode
export class SlackInteractiveEndpoint extends NodeBase {
  private listeners: ISlackInteractiveListener[] = [];
  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    const endpoint = config['interactiveEndpoint'] as string;
    const webServer = this.container.getInstance('WebServer') as WebServer;
    webServer.addPostEndpoint(endpoint, (req, res) => {
      console.log('slack interaction endpoint', req.body);
      const form = req.body as Record<string, string>;
      const payload = JSON.parse(form['payload']) as JSONObject;
      this.listeners.forEach(listener => {
        listener.onInteraction(payload);
      })
      res.sendStatus(200);
    });
  }

  public addListener(listener: ISlackInteractiveListener): void {
    this.listeners.push(listener);
  }
}