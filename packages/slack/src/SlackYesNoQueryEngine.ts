import {
  NodeBase,
  IContainer,
  JSONObject,
  ContainerNode,
  IQueryEngine
} from '@ts-flow/core';
import axios, { AxiosHeaders } from 'axios';
import { ISlackInteractiveListener, SlackInteractiveEndpoint } from './SlackInteractiveEndpoint';

const BLOCK_ID = 'YesNo';
@ContainerNode
export class SlackYesNoQueryEngine extends NodeBase implements IQueryEngine, ISlackInteractiveListener {
  private completeCallback: ((completeEventName: string, result: JSONObject) => void) | null = null;
  private userPrompt: string;
  private slackChannel: string;
  private yesEventName: string;
  private noEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.userPrompt = config['userPrompt'] as string;
    this.slackChannel = config['channel'] as string;
    this.yesEventName = config['yesOutputEventName'] as string;
    this.noEventName = config['noOutputEventName'] as string;

    const endpoint = this.container.createInstance('SlackInteractiveEndpoint', 'SlackInteractiveEndpoint', config) as SlackInteractiveEndpoint;
    endpoint.addListener(this);
  }

  onInteraction(payload: JSONObject): void {
    const blockId = payload['block_id'] as string;
    if (blockId === BLOCK_ID) {
      const actions: JSONObject[] = payload['actions'] as JSONObject[];
      this.completeCallback && this.completeCallback(
        actions[0]['value'] === 'yes' ? this.yesEventName : this.noEventName,
        payload);
    }
  }

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    this.completeCallback = completeCallback;
    const headers: AxiosHeaders = new AxiosHeaders();
    headers.setAuthorization(`Bearer ${process.env.SLACK_API_TOKEN}`);

    axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: this.slackChannel,
        text: this.userPrompt,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: this.userPrompt,
              emoji: true
            }
          },
          {
            type: 'actions',
            block_id: BLOCK_ID,
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Yes',
                  emoji: true
                },
                value: 'yes',
                action_id: 'yes'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'No',
                  emoji: true
                },
                value: 'no',
                action_id: 'no'
              }
            ]
          }
        ]
      },
      { headers }
    ).then((res) => {
      console.log('SlackYesNoQueryEngine send query complete', res.status, res.data);
    }).catch(e => {
      console.error('SlackYesNoQueryEngine send query error', e);
    });
  }
}