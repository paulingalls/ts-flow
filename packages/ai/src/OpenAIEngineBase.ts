import {
  IContainer,
  IQueryEngine,
  JSONObject,
  JSONValue,
  NodeBase,
} from "@ts-flow/core";
import { OpenAI } from "openai";

export abstract class OpenAIEngineBase
  extends NodeBase
  implements IQueryEngine
{
  protected readonly modelName: string;
  protected readonly openAI: OpenAI;
  protected readonly outputProperty: string;
  protected readonly outputEventName: string;

  protected constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.modelName = config["modelName"] as string;
    this.outputProperty = config["outputProperty"] as string;
    this.outputEventName = config["outputEventName"] as string;

    this.openAI = new OpenAI();
  }

  async execute(
    data: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    console.log("executing query for node", this.id);

    if (data instanceof Array) {
      const promises: Promise<void>[] = [];
      data.forEach((value) => {
        const item = value as JSONObject;
        promises.push(
          new Promise((resolve, reject) => {
            this.queryAI(item)
              .then((result) => {
                item[this.outputProperty] = result;
                resolve();
              })
              .catch((e) => {
                console.error("error executing query ai", e);
                reject(new Error("error executing query ai"));
              });
          }),
        );
      });
      return Promise.all(promises)
        .then(() => {
          console.log(
            "all promises resolved, sending event: ",
            this.outputEventName,
          );
          completeCallback(this.outputEventName, data);
        })
        .catch((e) => console.error("error executing query ai", e));
    } else {
      return this.queryAI(data)
        .then((result) => {
          data[this.outputProperty] = result;
          completeCallback(this.outputEventName, data);
        })
        .catch((e) => {
          console.error("error executing query ai", e);
        });
    }
  }

  abstract queryAI(payload: JSONObject): Promise<JSONValue>;
}
