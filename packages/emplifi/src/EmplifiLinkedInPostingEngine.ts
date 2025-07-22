import type { IContainer, IQueryEngine, JSONObject } from "@ts-flow/core";
import { ContainerNode, keywordReplacement, NodeBase } from "@ts-flow/core";
import axios from "axios";
import { EmplifiAuthManager } from "./auth";

@ContainerNode
export class EmplifiLinkedInPostingEngine
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
    console.log("[EmplifiLinkedInPostingEngine] Executing");

    const token = await this.authManager.getValidToken();
    const processedText = keywordReplacement(this.postText, payload);
    const processedUrl = keywordReplacement(this.postUrl, payload);

    const url = new URL(processedUrl);
    if (!url.searchParams.has("utm_source")) {
      url.searchParams.append("utm_source", "linkedin");
    }
    if (!url.searchParams.has("utm_medium")) {
      url.searchParams.append("utm_medium", "social");
    }
    if (!url.searchParams.has("utm_campaign")) {
      url.searchParams.append("utm_campaign", this.utmCampaign);
    }

    const finalUrl = url.toString();

    const postBody = {
      profile_id: this.profileId,
      comment: processedText, // LinkedIn uses 'comment' instead of 'message' or 'text'
      content_url: finalUrl, // LinkedIn uses 'content_url' for links
      published: false, // Set to false for draft status
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}api/v1/profiles/${this.profileId}/linkedin/posts`,
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
        "[EmplifiLinkedInPostingEngine] Post response:",
        JSON.stringify(response.data),
      );

      const boundCallback = (eventName: string, result: JSONObject): void => {
        completeCallback(eventName, result);
      };

      boundCallback(this.outputEventName, payload);
    } catch (error) {
      console.error(
        "[EmplifiLinkedInPostingEngine] Error creating LinkedIn post:",
        error,
      );
      throw error;
    }
  }
}
