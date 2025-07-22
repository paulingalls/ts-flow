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
    this.outputProperty = config["outputProperty"] as string;
    this.headerSchema = config["headerSchema"] as JSONObject || {
      "Content-Type": "application/json"
    };
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    if (Array.isArray(payload)) {
      await Promise.all(
        payload.map(async (item: JSONObject) => {
          const url: string = keywordReplacement(this.urlTemplate, item);
          const headers: AxiosHeaders = injectDataIntoJSONObject(
            item,
            this.headerSchema,
          ) as AxiosHeaders;
          
          try {
            const res = await axios.get(url, { headers });
            if (this.outputProperty) {
              item[this.outputProperty] = res.data as JSONObject;
            } else {
              Object.assign(item, res.data);
            }
          } catch (e) {
            console.error("error getting http for array item", e);
          }
        })
      );
    } else {
      const url: string = keywordReplacement(this.urlTemplate, payload);
      const headers: AxiosHeaders = injectDataIntoJSONObject(
        payload,
        this.headerSchema,
      ) as AxiosHeaders;
      
      try {
        const res = await axios.get(url, { headers });
        if (this.outputProperty) {
          payload[this.outputProperty] = res.data as JSONObject;
        } else {
          Object.assign(payload, res.data);
        }
      } catch (e) {
        console.error("error getting http", e);
      }
    }

    completeCallback(this.outputEventName, payload);
  }
}
