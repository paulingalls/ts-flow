import { ContainerNode, IContainer, IQueryEngine, JSONObject, NodeBase } from '@ai-flow/core';

@ContainerNode
export class UrlEncodeTransform extends NodeBase implements IQueryEngine {
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
        if (item[this.dataTarget]) {
          item[this.dataTarget] = encodeURIComponent(item[this.dataTarget] as string);
        }
      })
    } else {
      if (data[this.dataTarget]) {
        data[this.dataTarget] = encodeURIComponent(data[this.dataTarget] as string);
      }
    }
    completeCallback(this.outputEventName, payload);
  }
}