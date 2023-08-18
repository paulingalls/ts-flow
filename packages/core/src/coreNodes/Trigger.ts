import { IContainer, JSONObject, NodeBase } from "../Container";
import { EventBus } from "./EventBus";

export interface ITrigger {
  registerTriggerCallback(execute: (event: string, payload: JSONObject) => void): void;
}
export class Trigger extends NodeBase {
  private trigger: ITrigger;
  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    const triggerType = config['triggerType'] as string;
    const triggerId = config["triggerId"] as string;
    const triggerConfig = config["triggerConfig"] as JSONObject;
    const trigger = this.container.createInstance(triggerId, triggerType, triggerConfig) as unknown;
    this.trigger = trigger as ITrigger;

    const eventBus = this.container.getInstance('EventBus') as EventBus;
    this.trigger.registerTriggerCallback((event,  payload) => {
      eventBus.sendEvent(event, payload);
    })
  }
}