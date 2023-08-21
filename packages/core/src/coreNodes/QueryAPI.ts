import { ContainerNode, IContainer, JSONObject, NodeBase } from "../Container";
import { EventBus } from "./EventBus";

export type QueryAPIResult = {
  result: JSONObject,
}

export interface IQueryAPIEngine {
  sendQuery(payload: JSONObject): Promise<QueryAPIResult>;
}

@ContainerNode
export class QueryAPI extends NodeBase {
  private queryEngine: IQueryAPIEngine;
  private outputEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    const engineType = config['engineType'] as string;
    const engineId = config["engineId"] as string;
    const engineConfig = config["engineConfig"] as JSONObject;
    const engine = this.container.createInstance(engineId, engineType, engineConfig) as unknown;
    this.queryEngine = engine as IQueryAPIEngine;

    const eventBus = this.container.getInstance('EventBus') as EventBus;
    const inputEventName = config['inputEventName'] as string;
    eventBus.addListener(inputEventName, this);

    this.outputEventName = config['outputEventName'] as string;
  }

  eventTriggered(payload: JSONObject): void {
    this.queryEngine.sendQuery(payload).then((response: QueryAPIResult) => {
      const eventBus = this.container.getInstance('EventBus') as EventBus;
      eventBus.sendEvent(this.outputEventName, { ...payload, ...response.result });
    }).catch(e => {
      console.log("error executing query", e);
    });
  }
}