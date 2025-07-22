import { ContainerNode, IContainer, JSONObject, NodeBase } from "../Container";
import { getJSONObjectFromPath } from "../utils";
import { EventBus, IEventListener } from "./EventBus";

@ContainerNode
export class AggregatorNode extends NodeBase implements IEventListener {
  private readonly requiredEvents: number;
  private readonly inputEventName: string;
  private readonly outputEventName: string;
  private receivedEvents: JSONObject[] = [];

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.requiredEvents = config["requiredEvents"] as number || 1;
    this.inputEventName = config["inputEventName"] as string;
    this.outputEventName = config["outputEventName"] as string;

    if (!this.inputEventName || !this.outputEventName) {
      throw new Error("inputEventName and outputEventName are required for AggregatorNode");
    }

    const eventBus = this.container.getInstance("EventBus") as EventBus;
    eventBus.addListener(this.inputEventName, this);
  }

  eventTriggered(payload: JSONObject): Promise<void> {
    this.receivedEvents.push(payload);

    if (this.receivedEvents.length >= this.requiredEvents) {
      const eventBus = this.container.getInstance("EventBus") as EventBus;
      
      const aggregatedPayload = { ...this.receivedEvents[0] };
      for (let i = 1; i < this.receivedEvents.length; i++) {
        const usedDataIndex = this.receivedEvents[i]["engineDataIndexUsed"];
        const usedDataRoot = this.receivedEvents[i]["engineDataRootUsed"];
        if (usedDataIndex !== undefined && usedDataRoot !== undefined) {
            const dataUsed = getJSONObjectFromPath(usedDataRoot as string, this.receivedEvents[i]);
            const targetData = getJSONObjectFromPath(usedDataRoot as string, aggregatedPayload);
            targetData[usedDataIndex as number] = dataUsed[usedDataIndex as number];
        }
      }
      
      eventBus.sendEvent(this.outputEventName, aggregatedPayload);
      this.receivedEvents = []; // Reset for next batch
    }
    return Promise.resolve();
  }
}
