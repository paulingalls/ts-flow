import { ContainerNode, keywordReplacement, NodeBase } from "@ts-flow/core";
import type { IContainer, IQueryEngine, JSONObject } from "@ts-flow/core";
import axios from "axios";
import { EmplifiAuthManager } from "./auth";

@ContainerNode
export class EmplifiFacebookPostingEngine
  extends NodeBase
  implements IQueryEngine
{
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly profileId: string;
  private readonly postText: string;
  private readonly postUrl: string;
  private readonly utmCampaign: string;
  private readonly outputEventName: string;
  private readonly outputProperty: string;
  private readonly authManager: EmplifiAuthManager;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.baseUrl =
      (config["baseUrl"] as string) || "https://api.socialbakers.com/";
    this.apiKey = keywordReplacement(config["apiKey"] as string, {});
    this.apiSecret = keywordReplacement(config["apiSecret"] as string, {});
    this.profileId = config["profileId"] as string;
    this.postText = config["text"] as string;
    this.postUrl = config["url"] as string;
    this.utmCampaign = (config["utmCampaign"] as string) || "ts-flow";
    this.outputEventName = config["outputEventName"] as string;
    this.outputProperty = config["outputProperty"] as string;
    this.authManager = new EmplifiAuthManager({
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      baseUrl: this.baseUrl,
    });
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    console.log("[EmplifiLinkPostingEngine] Executing");

    const token = await this.authManager.getValidToken();
    const processedText = keywordReplacement(this.postText, payload);
    if (typeof processedText !== "string") {
      throw new Error(
        `Failed to process text - invalid type returned: ${typeof processedText}`,
      );
    }

    const processedUrl = keywordReplacement(this.postUrl, payload);
    if (typeof processedUrl !== "string") {
      throw new Error(
        `Failed to process URL - invalid type returned: ${typeof processedUrl}`,
      );
    }

    const url = new URL(processedUrl);
    if (!url.searchParams.has("utm_source")) {
      url.searchParams.append("utm_source", "facebook");
    }
    if (!url.searchParams.has("utm_medium")) {
      url.searchParams.append("utm_medium", "social");
    }
    if (!url.searchParams.has("utm_campaign")) {
      url.searchParams.append("utm_campaign", this.utmCampaign);
    }

    const finalUrl = url.toString();

    // Schedule post for 5 hours in the future
    //const scheduledTime = Math.floor(Date.now() / 1000) + (5 * 60 * 60);

    const postBody = {
      profile_id: this.profileId,
      message: processedText,
      link: finalUrl,
      //scheduled_publish_time: scheduledTime,
      published: false,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}api/v1/profiles/${this.profileId}/facebook/feed`,
        postBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const responseData = response.data as JSONObject;
      if (this.outputProperty) {
        payload[this.outputProperty] = responseData;
      } else {
        payload = { ...payload, ...responseData };
      }

      console.log(
        "[EmplifiLinkPostingEngine] Post response:",
        JSON.stringify(response.data),
      );

      const boundCallback = (eventName: string, result: JSONObject): void => {
        completeCallback(eventName, result);
      };

      boundCallback(this.outputEventName, payload);
    } catch (error) {
      console.error(
        "[EmplifiLinkPostingEngine] Error creating Facebook post:",
        error,
      );
      throw error;
    }
  }
}
