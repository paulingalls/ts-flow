import { ContainerNode, IContainer, IQueryEngine, JSONObject, NodeBase } from '@ai-flow/core';

@ContainerNode
export class DeleteTransform extends NodeBase implements IQueryEngine {
  private readonly outputEventName: string;
  private readonly dataRoot: string;
  private readonly dataTarget: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.outputEventName = config['outputEventName'] as string;
    this.dataRoot = config['dataRoot'] as string;
    this.dataTarget = config['dataTarget'] as string;
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
        delete item[this.dataTarget];
      })
    } else {
      delete data[this.dataTarget];
    }
    completeCallback(this.outputEventName, payload);
  }
}