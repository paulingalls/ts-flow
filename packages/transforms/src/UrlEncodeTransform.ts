import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  NodeBase,
} from "@ts-flow/core";

@ContainerNode
export class UrlEncodeTransform extends NodeBase implements IQueryEngine {
  private readonly outputEventName: string;
  private readonly dataTarget: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.outputEventName = config["outputEventName"] as string;
    this.dataTarget = config["dataTarget"] as string;
  }

  execute(
    data: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    if (data instanceof Array) {
      data.forEach((item: JSONObject) => {
        if (item[this.dataTarget]) {
          item[this.dataTarget] = encodeURIComponent(
            item[this.dataTarget] as string,
          );
        }
      });
    } else {
      if (data[this.dataTarget]) {
        data[this.dataTarget] = encodeURIComponent(
          data[this.dataTarget] as string,
        );
      }
    }
    completeCallback(this.outputEventName, data);
    return Promise.resolve();
  }
}
