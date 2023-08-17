import { IContainer, IQueryAPIEngine, JSONObject, NodeBase, QueryAPIResult } from "@ai-flow/core";
import axios from "axios";

export class HttpPostQueryEngine extends NodeBase implements IQueryAPIEngine {
  private readonly url: string;
  private bodyType: string;
  private readonly bodySchema: JSONObject;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.url = config['postUrl'] as string;
    this.bodyType = config['bodyType'] as string;
    this.bodySchema = config['bodySchema'] as JSONObject;
  }

  async sendQuery(payload: JSONObject): Promise<QueryAPIResult> {
    if (this.bodyType.toLowerCase() === 'json') {
      const postBody: JSONObject = {};
      Object.keys(this.bodySchema).forEach(key => {
        postBody[key] = payload[this.bodySchema[key] as string];
      });
      const res = await axios.post(this.url, postBody);
      return {
        result: res.data as JSONObject
      };
    }
    return Promise.resolve({result: {}});
  }

}