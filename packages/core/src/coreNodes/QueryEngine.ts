import { ContainerNode, IContainer, JSONObject, NodeBase } from "../Container";
import { EventBus, IEventListener } from "./EventBus";
import { getJSONObjectFromPath } from "../utils";

export interface IQueryEngine {
  execute(
    data: JSONObject, // Pre-processed data instead of raw payload
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void>;
}

@ContainerNode
export class QueryEngine extends NodeBase implements IEventListener {
  private queryEngine: IQueryEngine;
  private readonly engineDataRoot?: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    const engineType = config["engineType"] as string;
    const engineId = config["engineId"] as string;
    const engineConfig = config["engineConfig"] as JSONObject;
    const engine = this.container.createInstance(
      engineId,
      engineType,
      engineConfig,
    ) as unknown;
    this.queryEngine = engine as IQueryEngine;
    this.engineDataRoot = config["engineDataRoot"] as string;

    const eventBus = this.container.getInstance("EventBus") as EventBus;
    const inputEventName = config["inputEventName"] as string;
    eventBus.addListener(inputEventName, this);
  }

  protected selectData(payload: JSONObject): JSONObject {
    return this.engineDataRoot
      ? getJSONObjectFromPath(this.engineDataRoot, payload)
      : payload;
  }

  async eventTriggered(payload: JSONObject): Promise<void> {
    const selectedData = this.selectData(payload);
    await this.queryEngine.execute(selectedData, (eventName, result) => {
      const eventBus = this.container.getInstance("EventBus") as EventBus;
      eventBus.sendEvent(eventName, { ...payload, ...result });
    });
  }
}
