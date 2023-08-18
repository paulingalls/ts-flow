import { IContainer, ITrigger, JSONObject, NodeBase } from "@ai-flow/core";
import cron from 'node-cron';

export class CronTrigger extends NodeBase implements ITrigger {
  private readonly cron: string;
  private readonly triggerOnStart: boolean;
  private readonly outputEventName: string;
  private readonly payload: JSONObject;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.cron = config['cron'] as string;
    this.outputEventName = config['outputEventName'] as string;
    this.triggerOnStart = (config['triggerOnStart'] as string) === 'true';
    this.payload = config['payload'] as JSONObject;
  }
  registerTriggerCallback(execute: (event: string, payload: JSONObject) => void): void {
    cron.schedule(this.cron, () => {
      execute(this.outputEventName, this.payload);
    });
    if (this.triggerOnStart) {
      execute(this.outputEventName, this.payload)
    }
  }

}