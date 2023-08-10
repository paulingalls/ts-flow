import { ContainerNode, IContainer, NodeBase, JSONObject } from "../Container";
import { EventBus, IEventListener } from "./EventBus";

export type QueryResponse = {
  role: string;
  content?: string;
  function_call?: {
    name?: string;
    arguments?: string;
  }
}

interface QueryTargetAI extends ContainerNode {
  sendQuery(payload: JSONObject): Promise<QueryResponse>;
}

@ContainerNode
export class QueryAI extends NodeBase implements IEventListener {
  private queryEngine: QueryTargetAI | null = null;
  private outputEventName: string = '';

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.init(config);
  }

  init(config: JSONObject): void {
    const modelType = config['modelEngineType'] as string;
    if (modelType) {
      const engineId = config["engineId"] as string;
      const engineConfig = config["config"] as JSONObject;
      const engine = this.container.createInstance(engineId, modelType, engineConfig) as unknown;
      if (engine) {
        this.queryEngine = engine as QueryTargetAI;
      }

      const eventBus = this.container.getInstance('EventBus') as EventBus;
      const inputEventName = config['inputEventName'] as string;
      eventBus.addListener(inputEventName, this);

      this.outputEventName = config['outputEventName'] as string;
    }
  }

  eventTriggered(payload: JSONObject): void {
    this.queryEngine?.sendQuery(payload).then((response: QueryResponse) => {
      const eventBus = this.container.getInstance('EventBus') as EventBus;
      eventBus.sendEvent(this.outputEventName, {...response});
    }).catch(e => {
      console.log("error executing query", e);
    });
  }


}