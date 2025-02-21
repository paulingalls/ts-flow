import { ContainerNode, IContainer, NodeBase, JSONObject } from "../Container";

export interface IEventListener {
  eventTriggered(payload: JSONObject): Promise<void>;
}

@ContainerNode
export class EventBus extends NodeBase {
  private devMode: boolean = false;
  private listeners: Record<string, Array<IEventListener>> = {};

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    if (config['devMode']) {
      console.log('setting dev mode to true for EventBus');
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
    if (this.devMode) {
      console.log('EventBus sendEvent', eventName, payload);
    }
    const promises: Promise<void>[] = [];
    this.listeners[eventName]?.forEach((listener) => {
      promises.push(listener.eventTriggered(payload));
    })
    Promise.all(promises).catch(e => console.error('error sending event', eventName, e));
  }
}