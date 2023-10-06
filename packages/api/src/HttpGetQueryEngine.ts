import {
  ContainerNode,
  IContainer,
  JSONObject,
  NodeBase,
  keywordReplacement,
  IQueryEngine
} from "@ts-flow/core";
import axios from "axios";

@ContainerNode
export class HttpGetQueryEngine extends NodeBase implements IQueryEngine {
  private readonly urlTemplate: string;
  private readonly bodyType: string;
  private readonly outputEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config['urlTemplate'] as string;
    this.bodyType = config['bodyType'] as string;
    this.outputEventName = config['outputEventName'] as string;
  }

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    const url: string = keywordReplacement(this.urlTemplate, payload);
    axios.get(url).then((res) => {
      completeCallback(this.outputEventName, {...payload, ...res.data} as JSONObject);
    }).catch(e => {console.error('error getting http', e)});
  }
}