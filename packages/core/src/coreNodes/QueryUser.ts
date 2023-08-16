import { ContainerNode, JSONObject, NodeBase, IContainer } from "../Container";
import { EventBus, IEventListener } from "./EventBus";

export interface IQueryUserEngine {
  sendQuery(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void;
}

@ContainerNode
export class QueryUser extends NodeBase implements IEventListener {
  private queryEngine: IQueryUserEngine;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    const queryUserEngineType = config['queryUserEngineType'] as string;
    const engineId = config["engineId"] as string;
    const engineConfig = config["engineConfig"] as JSONObject;
    const engine = this.container.createInstance(engineId, queryUserEngineType, engineConfig) as unknown;
    this.queryEngine = engine as IQueryUserEngine;

    const eventBus = this.container.getInstance('EventBus') as EventBus;
    const inputEventName = config['inputEventName'] as string;
    eventBus.addListener(inputEventName, this);
  }

  eventTriggered(payload: JSONObject): void {
    this.queryEngine.sendQuery(payload, (eventName, result) => {
      const eventBus = this.container.getInstance('EventBus') as EventBus;
      eventBus.sendEvent(eventName, {...payload, ...result});
    });
  }

}