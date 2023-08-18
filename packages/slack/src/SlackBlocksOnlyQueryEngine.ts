import { IContainer, IQueryUserEngine, JSONObject, JSONValue, keywordReplacement, NodeBase } from "@ai-flow/core";
import axios from "axios/index";

export class SlackBlocksOnlyQueryEngine extends NodeBase implements IQueryUserEngine {
  private userPrompt: string;
  private slackChannel: string;
  private outputEventName: string;
  private dataRoot: string;
  private blocks: Array<JSONValue>;

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
    completeCallback(this.outputEventName, data);
  }

  sendSlackMessage(data: JSONObject): void {
    const blocks = structuredClone(this.blocks);
    const dataFullBlocks = this.injectDataToBlocks(data, blocks);

    axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        token: process.env.SLACK_API_TOKEN || '',
        channel: this.slackChannel,
        text: this.userPrompt,
        blocks: dataFullBlocks
      }
    ).then((res) => {
      console.log(res);
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
      if (item[key] instanceof String) {
        item[key] = keywordReplacement(item[key] as string, data);
      } else if (item[key] instanceof Object) {
        const subItem = item[key] as JSONObject;
        Object.keys(subItem).forEach((subKey) => {
          if (subItem[subKey] instanceof String) {
            subItem[subKey] = keywordReplacement(subItem[subKey] as string, data);
          }
        })
      }
    })
  }
}