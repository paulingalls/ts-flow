import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  keywordReplacement,
  NodeBase,
  injectDataIntoJSONObject,
} from "@ts-flow/core";
import axios, { AxiosHeaders } from "axios";

@ContainerNode
export class HttpGetQueryEngine extends NodeBase implements IQueryEngine {
  private readonly urlTemplate: string;
  private readonly outputEventName: string;
  private readonly outputProperty: string;
  private readonly headerSchema: JSONObject;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config["urlTemplate"] as string;
    this.outputEventName = config["outputEventName"] as string;
    this.outputProperty = config["outputEventProperty"] as string;
    this.headerSchema = config["headerSchema"] as JSONObject || {
      "Content-Type": "application/json"
    };
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    const url: string = keywordReplacement(this.urlTemplate, payload);
    const headers: AxiosHeaders = injectDataIntoJSONObject(
      payload,
      this.headerSchema,
    ) as AxiosHeaders;
    return axios
      .get(url, { headers })
      .then((res) => {
        if (this.outputProperty) {
          payload[this.outputProperty] = res.data as JSONObject;
        } else {
          payload = { ...payload, ...res.data } as JSONObject;
        }
        completeCallback(this.outputEventName, payload);
      })
      .catch((e) => {
        console.error("error getting http", e);
      });
  }
}
