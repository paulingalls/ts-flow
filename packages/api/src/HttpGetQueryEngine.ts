import { ContainerNode, IContainer, IQueryAPIEngine, JSONObject, NodeBase, QueryAPIResult, keywordReplacement } from "@ai-flow/core";
import axios from "axios";

@ContainerNode
export class HttpGetQueryEngine extends NodeBase implements IQueryAPIEngine {
  private readonly urlTemplate: string;
  private bodyType: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config['urlTemplate'] as string;
    this.bodyType = config['bodyType'] as string;
  }

  async sendQuery(payload: JSONObject): Promise<QueryAPIResult> {
    const url: string = keywordReplacement(this.urlTemplate, payload);
    const res = await axios.get(url);
    console.log('response', res.data);
    return {
      result: res.data as JSONObject
    };
  }
}