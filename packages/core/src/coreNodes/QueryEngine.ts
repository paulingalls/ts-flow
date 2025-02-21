import { ContainerNode, JSONObject, NodeBase, IContainer } from "../Container";
import { EventBus, IEventListener } from "./EventBus";

export interface IQueryEngine {
  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): Promise<void>;
}

@ContainerNode
export class QueryEngine extends NodeBase implements IEventListener {
  private queryEngine: IQueryEngine;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    const engineType = config['engineType'] as string;
    const engineId = config["engineId"] as string;
    const engineConfig = config["engineConfig"] as JSONObject;
    const engine = this.container.createInstance(engineId, engineType, engineConfig) as unknown;
    this.queryEngine = engine as IQueryEngine;

    const eventBus = this.container.getInstance('EventBus') as EventBus;
    const inputEventName = config['inputEventName'] as string;
    eventBus.addListener(inputEventName, this);
  }

  async eventTriggered(payload: JSONObject): Promise<void> {
    await this.queryEngine.execute(payload, (eventName, result) => {
      const eventBus = this.container.getInstance('EventBus') as EventBus;
      eventBus.sendEvent(eventName, {...payload, ...result});
    });
  }

}