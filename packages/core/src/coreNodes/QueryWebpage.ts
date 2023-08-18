import { ContainerNode, IContainer, JSONObject, NodeBase } from "../Container";
import { EventBus } from "./EventBus";

export interface IQueryWebEngine {
  loadAndQueryPage(payload: JSONObject): Promise<JSONObject>;
}

@ContainerNode
export class QueryWebpage extends NodeBase {
  private queryEngine: IQueryWebEngine;
  private outputEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    const engineType = config['webScrapeEngineType'] as string;
    const engineId = config["engineId"] as string;
    const engineConfig = config["engineConfig"] as JSONObject;
    const engine = this.container.createInstance(engineId, engineType, engineConfig) as unknown;
    this.queryEngine = engine as IQueryWebEngine;

    const eventBus = this.container.getInstance('EventBus') as EventBus;
    const inputEventName = config['inputEventName'] as string;
    eventBus.addListener(inputEventName, this);

    this.outputEventName = config['outputEventName'] as string;
  }

  eventTriggered(payload: JSONObject): void {
    this.queryEngine.loadAndQueryPage(payload).then((response: JSONObject) => {
      const eventBus = this.container.getInstance('EventBus') as EventBus;
      eventBus.sendEvent(this.outputEventName, { ...payload, ...response });
    }).catch(e => {
      console.log("error executing query", e);
    });
  }
}