import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  NodeBase,
} from "@ts-flow/core";

@ContainerNode
export class IncrementTransform extends NodeBase implements IQueryEngine {
  private readonly outputEventName: string;
  private readonly dataTarget: string;
  private readonly dataType: string;
  private dataIncrement: string | number;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.outputEventName = config["outputEventName"] as string;
    this.dataTarget = config["dataTarget"] as string;
    this.dataType = config["dataType"] as string;
    if (this.dataType === "number") {
      this.dataIncrement = config["dataIncrement"] as number;
    } else {
      this.dataIncrement = config["dataIncrement"] as string;
    }
  }

  execute(
    data: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    if (data instanceof Array) {
      data.forEach((item: JSONObject) => {
        this.increment(item);
      });
    } else {
      this.increment(data);
    }
    completeCallback(this.outputEventName, data);
    return Promise.resolve();
  }

  increment(data: JSONObject) {
    if (this.dataType === "number") {
      const originalValue = data[this.dataTarget] as number;
      data[this.dataTarget] = originalValue + (this.dataIncrement as number);
    } else if (this.dataType === "date") {
      const originalValue = new Date(
        Date.parse(data[this.dataTarget] as string),
      );
      originalValue.setDate(
        originalValue.getDate() + (this.dataIncrement as number),
      );
      data[this.dataTarget] = originalValue.toISOString();
    }
  }
}
