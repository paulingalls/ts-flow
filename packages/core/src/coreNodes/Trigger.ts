import { ContainerNode, IContainer, JSONObject, NodeBase } from "../Container";
import { EventBus } from "./EventBus";

export interface ITrigger {
  registerTriggerCallback(execute: (payload: JSONObject) => void): void;
}
@ContainerNode
export class Trigger extends NodeBase {
  private trigger: ITrigger;
  private readonly outputEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    const triggerType = config['triggerType'] as string;
    const triggerId = config["triggerId"] as string;
    const triggerConfig = config["triggerConfig"] as JSONObject;
    this.outputEventName = config['outputEventName'] as string;

    const trigger = this.container.createInstance(triggerId, triggerType, triggerConfig) as unknown;
    this.trigger = trigger as ITrigger;

    const eventBus = this.container.getInstance('EventBus') as EventBus;
    this.trigger.registerTriggerCallback((payload) => {
      eventBus.sendEvent(this.outputEventName, payload);
    });
  }
}