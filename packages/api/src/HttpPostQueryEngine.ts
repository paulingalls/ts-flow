import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  keywordReplacement,
  NodeBase,
} from "@ai-flow/core";
import axios from "axios";

@ContainerNode
export class HttpPostQueryEngine extends NodeBase implements IQueryEngine {
  private readonly urlTemplate: string;
  private bodyType: string;
  private readonly bodySchema: JSONObject;
  private readonly outputEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config['postUrl'] as string;
    this.bodyType = config['bodyType'] as string;
    this.bodySchema = config['bodySchema'] as JSONObject;
    this.outputEventName = config['outputEventName'] as string;
  }

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    const url = keywordReplacement(this.urlTemplate, payload);
    if (this.bodyType.toLowerCase() === 'json') {
      const postBody: JSONObject = {};
      Object.keys(this.bodySchema).forEach(key => {
        postBody[key] = payload[this.bodySchema[key] as string];
      });
      axios.post(url, postBody).then((res) => {
        completeCallback(this.outputEventName, res.data as JSONObject);
      }).catch(e => {console.error('error getting http', e)});
    }
  }

}