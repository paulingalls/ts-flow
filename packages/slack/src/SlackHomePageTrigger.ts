import {
  ContainerNode,
  IContainer,
  injectDataIntoJSONObject,
  ITrigger,
  JSONObject,
  JSONValue,
  NodeBase
} from '@ts-flow/core';
import { ISlackInteractiveListener, SlackInteractiveEndpoint } from './SlackInteractiveEndpoint';
import axios, { AxiosHeaders } from 'axios';
import { ISlackEventsListener, SlackEventsEndpoint } from './SlackEventsEndpoint';

@ContainerNode
export class SlackHomePageTrigger extends NodeBase implements ITrigger, ISlackInteractiveListener, ISlackEventsListener {
  private readonly outputEventName: string;
  private readonly blocks: Array<JSONValue>;
  private readonly triggerBlockId: string;
  private readonly payloadTemplate: JSONObject;
  private execute: (eventName:string, payload: JSONObject) => void = () => {};

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.outputEventName = config['outputEventName'] as string;
    this.blocks = config['blocks'] as Array<JSONValue>;
    this.triggerBlockId = config['triggerBlockId'] as string;
    this.payloadTemplate = config['payloadTemplate'] as JSONObject;

    const interactiveEndpoint = this.container.createInstance('SlackInteractiveEndpoint', 'SlackInteractiveEndpoint', config) as SlackInteractiveEndpoint;
    interactiveEndpoint.addListener(this);

    const eventsEndpoint = this.container.createInstance('SlackEventsEndpoint', 'SlackEventsEndpoint', config) as SlackEventsEndpoint;
    eventsEndpoint.addListener(this);
  }

  registerTriggerCallback(execute: (eventName: string, payload: JSONObject) => void): void {
    this.execute = execute;
    this.publishBlocksToHomePageForUser(process.env.DEFAULT_SLACK_USER_ID as string);
  }

  onInteraction(payload: JSONObject): void {
    const actions: JSONObject[] = payload['actions'] as JSONObject[];
    if (this.triggerBlockId === actions[0]['block_id'] as string) {
      const payload = injectDataIntoJSONObject(actions[0], this.payloadTemplate);
      console.log('payload for output', payload);
      this.execute(this.outputEventName, payload);
    }
  }

  onEvent(payload: JSONObject): void {
    const event = payload['event'] as JSONObject;
    const type = event['type'] as string;
    if (type === 'app_home_opened') {
      const userId = event['user'] as string;
      this.publishBlocksToHomePageForUser(userId);
    }
  }

  private publishBlocksToHomePageForUser(userId: string) {
    const headers: AxiosHeaders = new AxiosHeaders();
    headers.setAuthorization(`Bearer ${process.env.SLACK_API_TOKEN}`);

    axios.post(
      'https://slack.com/api/views.publish',
      {
        user_id: userId,
        view: {
          type: 'home',
          blocks: this.blocks
        }
      },
      { headers }
    ).then((res) => {
      console.log('SlackHomePageTrigger send query complete', res.status, res.data);
    }).catch(e => {
      console.error('SlackHomePageTrigger send query error', e);
    });
  }
}