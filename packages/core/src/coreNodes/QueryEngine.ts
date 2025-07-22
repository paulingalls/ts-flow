import { ContainerNode, IContainer, JSONObject, NodeBase } from "../Container";
import { EventBus, IEventListener } from "./EventBus";
import { getJSONObjectFromPath } from "../utils";

export interface IQueryEngine {
  execute(
    data: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void>;
}

@ContainerNode
export class QueryEngine extends NodeBase implements IEventListener {
  private queryEngine: IQueryEngine;
  private readonly engineDataRoot?: string;
  private readonly engineDataIndex?: number;

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
    this.engineDataIndex = config["engineDataIndex"] as number;
    const eventBus = this.container.getInstance("EventBus") as EventBus;
    const inputEventName = config["inputEventName"] as string;
    eventBus.addListener(inputEventName, this);
  }

  protected selectData(payload: JSONObject): JSONObject {
    const data = this.engineDataRoot 
      ? getJSONObjectFromPath(this.engineDataRoot, payload)
      : payload;
    if (data instanceof Array && this.engineDataIndex !== undefined) {
      return data[this.engineDataIndex] as JSONObject;
    }
    return data;
  }

  protected updatePayloadWithResult(payload: JSONObject, result: JSONObject, path?: string): JSONObject {
    if (!path) {
      return { ...payload, ...result };
    }

    const parts = path.split('.');
    const newPayload = { ...payload };
    let current = newPayload;
    
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...(current[parts[i]] as JSONObject) };
      current = current[parts[i]] as JSONObject;
    }
    const lastPart = parts[parts.length - 1];
    if (current[lastPart] instanceof Array && this.engineDataIndex !== undefined) {
      current[lastPart][this.engineDataIndex] = result;
    } else {
      current[lastPart] = result;
    }
    if (this.engineDataIndex !== undefined) {
      newPayload["engineDataIndexUsed"] = this.engineDataIndex;
      if (this.engineDataRoot !== undefined) {
        newPayload["engineDataRootUsed"] = this.engineDataRoot;
      }
    }
    return newPayload;
  }

  async eventTriggered(payload: JSONObject): Promise<void> {
    const selectedData = this.selectData(payload);
    console.log("queryEngine execute", this.id);
    await this.queryEngine.execute(selectedData, (eventName, result) => {
      const eventBus = this.container.getInstance("EventBus") as EventBus;
      const updatedPayload = this.updatePayloadWithResult(payload, result, this.engineDataRoot);
      eventBus.sendEvent(eventName, updatedPayload);
    });
  }
}
