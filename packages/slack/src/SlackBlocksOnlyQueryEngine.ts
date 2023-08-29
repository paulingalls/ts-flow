import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  JSONValue,
  keywordReplacement,
  NodeBase
} from "@ai-flow/core";
import axios, { AxiosHeaders } from "axios";

@ContainerNode
export class SlackBlocksOnlyQueryEngine extends NodeBase implements IQueryEngine {
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

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    const data: JSONObject = payload[this.dataRoot] as JSONObject;

    console.log('slack payload', payload);
    if (data instanceof Array) {
      const promises: Promise<void>[] = [];
      data.forEach((value) => {
        const item = value as JSONObject;
        promises.push(this.sendSlackMessage(item));
      })
      Promise.all(promises).then(() => {
        completeCallback(this.outputEventName, payload);
      }).catch(e => {
        console.error('error sending slack message', e);
      });
    } else {
      this.sendSlackMessage(data).then(() => {
        completeCallback(this.outputEventName, payload);
      }).catch(e => {
        console.error('error sending slack message', e);
      });
    }
  }

  async sendSlackMessage(data: JSONObject) {
    const blocks = structuredClone(this.blocks);
    const dataFullBlocks = this.injectDataToBlocks(data, blocks);
    const text = keywordReplacement(this.userPrompt, data);
    const headers: AxiosHeaders = new AxiosHeaders();
    headers.setAuthorization(`Bearer ${process.env.SLACK_API_TOKEN}`)
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: this.slackChannel,
        text,
        blocks: dataFullBlocks
      },
      {
        headers
      }
    );
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