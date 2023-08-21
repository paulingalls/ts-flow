import { ContainerNode, IContainer, NodeBase, JSONObject } from "../Container";
import { EventBus, IEventListener } from "./EventBus";

export interface IQueryTargetAI extends ContainerNode {
  sendQuery(payload: JSONObject): Promise<JSONObject>;
}

@ContainerNode
export class QueryAI extends NodeBase implements IEventListener {
  private queryEngine: IQueryTargetAI
  private outputEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    const modelType = config['engineType'] as string;
    const engineId = config["engineId"] as string;
    const engineConfig = config["engineConfig"] as JSONObject;
    const engine = this.container.createInstance(engineId, modelType, engineConfig) as unknown;
    this.queryEngine = engine as IQueryTargetAI;

    const eventBus = this.container.getInstance('EventBus') as EventBus;
    const inputEventName = config['inputEventName'] as string;
    eventBus.addListener(inputEventName, this);

    this.outputEventName = config['outputEventName'] as string;
  }

  eventTriggered(payload: JSONObject): void {
    this.queryEngine.sendQuery(payload).then((response: JSONObject) => {
      const eventBus = this.container.getInstance('EventBus') as EventBus;
      eventBus.sendEvent(this.outputEventName, { ...payload, ...response });
    }).catch(e => {
      console.log("error executing query", e);
    });
  }


}