import {
  ContainerNode,
  IContainer,
  injectDataIntoJSONObject,
  IQueryEngine,
  JSONObject,
  JSONValue,
  keywordReplacement,
  NodeBase
} from '@ai-flow/core';
import axios, { AxiosHeaders } from 'axios';

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
      });
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
    const dataFullBlocks = injectDataIntoJSONObject(data, { blocks: this.blocks });
    const text = keywordReplacement(this.userPrompt, data);
    const headers: AxiosHeaders = new AxiosHeaders();
    headers.setAuthorization(`Bearer ${process.env.SLACK_API_TOKEN}`);
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: this.slackChannel,
        text,
        blocks: dataFullBlocks.blocks
      },
      {
        headers
      }
    );
  }
}