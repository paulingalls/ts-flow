import {
  ContainerNode,
  IContainer,
  IQueryUserEngine,
  JSONObject,
  JSONValue,
  keywordReplacement,
  NodeBase
} from "@ai-flow/core";
import axios, { AxiosHeaders } from "axios";

@ContainerNode
export class SlackBlocksOnlyQueryEngine extends NodeBase implements IQueryUserEngine {
  private readonly userPrompt: string;
  private readonly slackChannel: string;
  private readonly outputEventName: string;
  private readonly dataRoot: string;
  private readonly blocks: Array<JSONValue>;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.userPrompt = config['userPrompt'] as string;
    this.slackChannel = config['channel'] as string;
    this.outputEventName = config['outputEventName'] as string;
    this.dataRoot = config['dataRoot'] as string;
    this.blocks = config['blocks'] as Array<JSONValue>;
  }

  sendQuery(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    const data: JSONObject = payload[this.dataRoot] as JSONObject;
    if (data instanceof Array) {
      data.forEach((value) => {
        const item = value as JSONObject;
        this.sendSlackMessage(item);
      })
    } else {
      this.sendSlackMessage(data);
    }
    completeCallback(this.outputEventName, payload);
  }

  sendSlackMessage(data: JSONObject): void {
    const blocks = structuredClone(this.blocks);
    const dataFullBlocks = this.injectDataToBlocks(data, blocks);
    const text = keywordReplacement(this.userPrompt, data);
    const headers: AxiosHeaders = new AxiosHeaders();
    headers.setAuthorization(`Bearer ${process.env.SLACK_API_TOKEN}`)
    axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        token: process.env.SLACK_API_TOKEN || '',
        channel: this.slackChannel,
        text,
        blocks: dataFullBlocks
      },
      {
        headers
      }
    ).then((res) => {
      console.log(res.data);
    }).catch(e => {
      console.error(e);
    });
  }

  injectDataToBlocks(data: JSONObject, blocks: Array<JSONValue>): Array<JSONValue> {
    blocks.forEach((value) => {
      this.injectData(data, value as JSONObject);
    })
    return blocks;
  }

  injectData(data: JSONObject, item: JSONObject) {
    Object.keys(item).forEach((key) => {
      if (typeof item[key] === 'string') {
        item[key] = keywordReplacement(item[key] as string, data);
      } else if (typeof item[key] === 'object') {
        const subItem = item[key] as JSONObject;
        Object.keys(subItem).forEach((subKey) => {
          if (typeof subItem[subKey] === 'string') {
            subItem[subKey] = keywordReplacement(subItem[subKey] as string, data);
          }
        })
      }
    })
  }
}