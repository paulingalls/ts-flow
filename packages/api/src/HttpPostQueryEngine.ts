import {
  ContainerNode,
  IContainer,
  injectDataIntoJSONObject,
  IQueryEngine,
  JSONObject,
  keywordReplacement,
  NodeBase
} from '@ai-flow/core';
import axios, { AxiosHeaders } from 'axios';

@ContainerNode
export class HttpPostQueryEngine extends NodeBase implements IQueryEngine {
  private readonly urlTemplate: string;
  private readonly bodyType: string;
  private readonly bodySchema: JSONObject;
  private readonly outputEventName: string;
  private readonly bodyAdditionsFromPayload: JSONObject;
  private readonly headerSchema: JSONObject;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config['urlTemplate'] as string;
    this.bodyType = config['bodyType'] as string;
    this.bodySchema = config['bodySchema'] as JSONObject;
    this.headerSchema = config['headerSchema'] as JSONObject;
    this.bodyAdditionsFromPayload = config['bodyAdditionsFromPayload'] as JSONObject;
    this.outputEventName = config['outputEventName'] as string;
  }

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    const url = keywordReplacement(this.urlTemplate, payload);
    if (this.bodyType.toLowerCase() === 'json') {
      const postBody: JSONObject = injectDataIntoJSONObject(payload , this.bodySchema );
      Object.keys(this.bodyAdditionsFromPayload).forEach(key => {
        postBody[key] = payload[this.bodySchema[key] as string];
      });

      const headers: AxiosHeaders = injectDataIntoJSONObject(payload, this.headerSchema) as AxiosHeaders;
      axios.post(url, postBody, {headers}).then((res) => {
        console.log(JSON.stringify(res.data));
        completeCallback(this.outputEventName, res.data as JSONObject);
      }).catch(e => {console.error('error posting http', e)});
    }
  }

}