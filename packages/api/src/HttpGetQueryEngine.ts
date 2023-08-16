import { ContainerNode, IContainer, IQueryAPIEngine, JSONObject, NodeBase, QueryAPIResult, keywordReplacement } from "@ai-flow/core";
import axios from "axios";

@ContainerNode
export class HttpGetQueryEngine extends NodeBase implements IQueryAPIEngine {
  private urlTemplate: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config['url'] as string;
  }

  sendQuery(payload: JSONObject): Promise<QueryAPIResult> {
    const interimUrl: string = keywordReplacement(this.urlTemplate, payload);
    const finalUrl:string = keywordReplacement(interimUrl, process.env as JSONObject);
    return axios.get(finalUrl).then((res) => {
      return {
        result: res.data as JSONObject
      }
    })
  }
}