import { NodeBase, IQueryUserEngine, IContainer, JSONObject, WebServer, ContainerNode } from "@ai-flow/core";
import axios from "axios";

@ContainerNode
export class SlackYesNoQueryEngine extends NodeBase implements IQueryUserEngine {
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
      console.log('slack interaction endpoint', req);
      const form = req.body as JSONObject;
      const payload = JSON.parse(form['payload'] as string) as JSONObject;
      console.log(payload);
      this.completeCallback && this.completeCallback(
        payload['action'] === 'yes' ? this.yesEventName : this.noEventName,
        payload);
      res.send(200);
    });
  }

  sendQuery(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    this.completeCallback = completeCallback;
    axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        token: process.env.SLACK_API_TOKEN || '',
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
      }
    ).then((res) => {
      console.log(res);
    }).catch(e => {
      console.error(e);
    });
  }
}