import { ContainerNode, IContainer, JSONObject, NodeBase } from "../Container";
import { EventBus } from "./EventBus";

export interface ITrigger {
  registerTriggerCallback(
    execute: (eventName: string, payload: JSONObject) => void,
  ): void;
}

@ContainerNode
export class Trigger extends NodeBase {
  private readonly trigger: ITrigger;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    const triggerType = config["triggerType"] as string;
    const triggerId = config["triggerId"] as string;
    const triggerConfig = config["triggerConfig"] as JSONObject;

    const trigger = this.container.createInstance(
      triggerId,
      triggerType,
      triggerConfig,
    ) as unknown;
    this.trigger = trigger as ITrigger;

    const eventBus = this.container.getInstance("EventBus") as EventBus;
    this.trigger.registerTriggerCallback((eventName, payload) => {
      eventBus.sendEvent(eventName, payload);
    });
  }
}
