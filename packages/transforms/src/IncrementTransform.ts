import { ContainerNode, IContainer, IQueryEngine, JSONObject, NodeBase } from '@ai-flow/core';

@ContainerNode
export class IncrementTransform extends NodeBase implements IQueryEngine {
  private readonly outputEventName: string;
  private readonly dataRoot: string;
  private readonly dataTarget: string;
  private readonly dataType: string;
  private dataIncrement: string | number;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.outputEventName = config['outputEventName'] as string;
    this.dataRoot = config['dataRoot'] as string;
    this.dataTarget = config['dataTarget'] as string;
    this.dataType = config['dataType'] as string;
    if (this.dataType === 'number') {
      this.dataIncrement = config['dataIncrement'] as number;
    } else {
      this.dataIncrement = config['dataIncrement'] as string;
    }
  }

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    let data: JSONObject;
    if (this.dataRoot) {
      data = payload[this.dataRoot] as JSONObject;
    } else {
      data = payload;
    }
    if (data instanceof Array) {
      data.forEach((item: JSONObject) => {
        this.increment(item);
      })
    } else {
      this.increment(data);
    }
    completeCallback(this.outputEventName, payload);
  }

  increment(dataRoot: JSONObject) {
    if (this.dataType === 'number') {
      const originalValue = dataRoot[this.dataTarget] as number;
      dataRoot[this.dataTarget] = originalValue + (this.dataIncrement as number);
    } else if (this.dataType === 'date') {
      const originalValue = new Date(Date.parse(dataRoot[this.dataTarget] as string));
      originalValue.setDate(originalValue.getDate() + (this.dataIncrement as number));
      dataRoot[this.dataTarget] = originalValue.toISOString();
    }
  }
}