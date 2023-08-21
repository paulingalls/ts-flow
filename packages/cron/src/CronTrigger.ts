import { ContainerNode, EventBus, IContainer, IEventListener, ITrigger, JSONObject, NodeBase } from "@ai-flow/core";
import cron from 'node-cron';

@ContainerNode
export class CronTrigger extends NodeBase implements ITrigger, IEventListener {
  private readonly cron: string;
  private readonly triggerOnStart: boolean;
  private readonly outputEventName: string;
  private readonly payload: JSONObject;
  private execute: (event: string, payload: JSONObject) => void = () => {};

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.cron = config['cron'] as string;
    this.outputEventName = config['outputEventName'] as string;
    this.triggerOnStart = (config['triggerOnStart'] as string) === 'true';
    this.payload = config['payload'] as JSONObject;

    const eventBus = container.getInstance('EventBus') as EventBus;
    eventBus.addListener('bootstrapComplete', this);
  }
  registerTriggerCallback(execute: (event: string, payload: JSONObject) => void): void {
    this.execute = execute;
    cron.schedule(this.cron, () => {
      execute(this.outputEventName, this.payload);
    });
  }

  eventTriggered(): void {
    if (this.triggerOnStart) {
      this.execute(this.outputEventName, this.payload)
    }
  }

}