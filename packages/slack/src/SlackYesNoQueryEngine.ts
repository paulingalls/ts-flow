import {
  NodeBase,
  IContainer,
  JSONObject,
  WebServer,
  ContainerNode,
  IQueryEngine
} from "@ai-flow/core";
import axios, { AxiosHeaders } from "axios";

@ContainerNode
export class SlackYesNoQueryEngine extends NodeBase implements IQueryEngine {
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

    const endpoint = config['interactiveEndpoint'] as string;
    const webServer = this.container.getInstance('WebServer') as WebServer;
    webServer.addPostEndpoint(endpoint, (req, res) => {
      console.log('slack interaction endpoint', req.body);
      const form = req.body as Record<string, string>;
      const payload = JSON.parse(form['payload']) as JSONObject;
      const actions: JSONObject[] = payload['actions'] as JSONObject[];
      this.completeCallback && this.completeCallback(
        actions[0]['value'] === 'yes' ? this.yesEventName : this.noEventName,
        payload);
      res.sendStatus(200);
    });
  }

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    this.completeCallback = completeCallback;
    const headers: AxiosHeaders = new AxiosHeaders();
    headers.setAuthorization(`Bearer ${process.env.SLACK_API_TOKEN}`)

    axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: this.slackChannel,
        text: this.userPrompt,
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: this.userPrompt,
              emoji: true
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Yes",
                  emoji: true
                },
                value: "yes",
                action_id: "yes"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "No",
                  emoji: true
                },
                value: "no",
                action_id: "no"
              }
            ]
          }
        ]
      },
      {headers}
    ).then((res) => {
      console.log('SlackYesNoQueryEngine send query complete', res.status, res.data);
    }).catch(e => {
      console.error('SlackYesNoQueryEngine send query error', e);
    });
  }
}