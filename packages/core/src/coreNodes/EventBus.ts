import { ContainerNode, IContainer, NodeBase, JSONObject } from "../Container";

export interface IEventListener {
  eventTriggered(payload: JSONObject): void;
}

@ContainerNode
export class EventBus extends NodeBase {
  private devMode: boolean = false;
  private listeners: Record<string, Array<IEventListener>> = {};
  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.init(config);
  }

  init(config: JSONObject): void {
    if (config['devMode']) {
      this.devMode = true;
    }
  }

  addListener(eventName: string, listener: IEventListener) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].push(listener);
    } else {
      this.listeners[eventName] = [listener];
    }
  }

  sendEvent(eventName: string, payload: JSONObject) {
    this.listeners[eventName].forEach((listener) => {
      listener.eventTriggered(payload);
    })
  }
}