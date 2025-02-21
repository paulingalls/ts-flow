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
  private readonly outputEventName: string;
  private readonly outputProperty: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config['urlTemplate'] as string;
    this.outputEventName = config['outputEventName'] as string;
    this.outputProperty = config['outputEventProperty'] as string;
  }

  async execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): Promise<void> {
    const url: string = keywordReplacement(this.urlTemplate, payload);
    return axios.get(url).then((res) => {
      if (this.outputProperty) {
        payload[this.outputProperty] = res.data as JSONObject;
      } else {
        payload = {...payload, ...res.data} as JSONObject;
      }
      completeCallback(this.outputEventName, payload);
    }).catch(e => {console.error('error getting http', e)});
  }
}