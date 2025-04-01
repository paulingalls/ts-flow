import {
  ContainerNode,
  IContainer,
  injectDataIntoJSONObject,
  IQueryEngine,
  JSONObject,
  keywordReplacement,
  NodeBase,
} from "@ts-flow/core";
import axios, { AxiosHeaders } from "axios";

@ContainerNode
export class HttpPostQueryEngine extends NodeBase implements IQueryEngine {
  private readonly urlTemplate: string;
  private readonly bodyType: string;
  private readonly bodySchema: JSONObject;
  private readonly outputEventName: string;
  private readonly outputProperty: string;
  private readonly bodyAdditionsFromPayload: JSONObject;
  private readonly headerSchema: JSONObject;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config["urlTemplate"] as string;
    this.bodyType = config["bodyType"] as string;
    this.bodySchema = config["bodySchema"] as JSONObject;
    this.headerSchema = config["headerSchema"] as JSONObject || {
      "Content-Type": "application/json"
    };
    this.bodyAdditionsFromPayload = config[
      "bodyAdditionsFromPayload"
    ] as JSONObject;
    this.outputEventName = config["outputEventName"] as string;
    this.outputProperty = config["outputProperty"] as string;
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    if (this.bodyType.toLowerCase() !== "json") {
      return;
    }

    if (Array.isArray(payload)) {
      await Promise.all(
        payload.map(async (item: JSONObject) => {
          const url = keywordReplacement(this.urlTemplate, item);
          const postBody: JSONObject = injectDataIntoJSONObject(
            item,
            this.bodySchema,
          );
          Object.keys(this.bodyAdditionsFromPayload).forEach((key) => {
            postBody[key] = item[this.bodySchema[key] as string];
          });

          const headers: AxiosHeaders = injectDataIntoJSONObject(
            item,
            this.headerSchema,
          ) as AxiosHeaders;

          try {
            const res = await axios.post(url, postBody, { headers });
            console.log(JSON.stringify(res.data));
            if (this.outputProperty) {
              item[this.outputProperty] = res.data as JSONObject;
            } else {
              Object.assign(item, res.data);
            }
          } catch (e) {
            console.error("error posting http for array item", e);
          }
        })
      );
    } else {
      const url = keywordReplacement(this.urlTemplate, payload);
      const postBody: JSONObject = injectDataIntoJSONObject(
        payload,
        this.bodySchema,
      );
      Object.keys(this.bodyAdditionsFromPayload).forEach((key) => {
        postBody[key] = payload[this.bodySchema[key] as string];
      });

      const headers: AxiosHeaders = injectDataIntoJSONObject(
        payload,
        this.headerSchema,
      ) as AxiosHeaders;

      try {
        const res = await axios.post(url, postBody, { headers });
        console.log(JSON.stringify(res.data));
        if (this.outputProperty) {
          payload[this.outputProperty] = res.data as JSONObject;
        } else {
          Object.assign(payload, res.data);
        }
      } catch (e) {
        console.error("error posting http", e);
      }
    }

    completeCallback(this.outputEventName, payload);
  }
}
