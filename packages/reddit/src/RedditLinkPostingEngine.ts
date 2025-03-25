import type { IContainer, IQueryEngine, JSONObject } from "@ts-flow/core";
import { ContainerNode, keywordReplacement, NodeBase } from "@ts-flow/core";
import axios from "axios";
import { RedditAuthManager } from "./auth";

@ContainerNode
export class RedditLinkPostingEngine extends NodeBase implements IQueryEngine {
  private readonly apiUrl: string;
  private readonly userAgent: string;
  private readonly clientID: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly subreddit: string;
  private readonly postTitle: string;
  private readonly postUrl: string;
  private readonly utmCampaign: string;
  private readonly outputEventName: string;
  private readonly outputProperty: string;
  private readonly authManager: RedditAuthManager;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.apiUrl = "https://oauth.reddit.com/api/submit";
    const appName = config["appName"] as string;
    this.username = keywordReplacement(config["username"] as string, {});
    this.clientID = keywordReplacement(config["clientID"] as string, {});
    this.clientSecret = keywordReplacement(
      config["clientSecret"] as string,
      {},
    );
    this.password = keywordReplacement(config["password"] as string, {});
    this.userAgent = `${appName} (by /u/${this.username})`;
    this.subreddit = config["subreddit"] as string;
    this.postTitle = config["title"] as string;
    this.postUrl = config["url"] as string;
    this.utmCampaign = (config["utmCampaign"] as string) || "ts-flow";
    this.outputEventName = config["outputEventName"] as string;
    this.outputProperty = config["outputProperty"] as string;
    this.authManager = new RedditAuthManager({
      clientId: this.clientID,
      clientSecret: this.clientSecret,
      userAgent: this.userAgent,
      username: this.username,
      password: this.password,
    });
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    console.log("[RedditLinkPostingEngine] Executing");

    const token = await this.authManager.getValidToken();
    const processedUrl = keywordReplacement(this.postUrl, payload);
    const url = new URL(processedUrl);

    if (!url.searchParams.has("utm_source")) {
      url.searchParams.append("utm_source", "reddit");
    }
    if (!url.searchParams.has("utm_medium")) {
      url.searchParams.append("utm_medium", "social");
    }
    if (!url.searchParams.has("utm_campaign")) {
      url.searchParams.append("utm_campaign", this.utmCampaign);
    }

    const headers = {
      Authorization: `bearer ${token}`,
      "User-Agent": this.authManager["userAgent"],
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const postBody = {
      api_type: "json",
      kind: "link",
      sr: this.subreddit,
      title: keywordReplacement(this.postTitle, payload),
      url: url.toString(),
    };
    return axios
      .post(this.apiUrl, postBody, { headers })
      .then((res) => {
        if (this.outputProperty) {
          payload[this.outputProperty] = res.data as JSONObject;
        } else {
          payload = res.data as JSONObject;
        }
        console.log(
          "[RedditLinkPostingEngine] Reddit post response:",
          JSON.stringify(res.data),
        );

        completeCallback(this.outputEventName, payload);
      })
      .catch((e) => {
        console.error(
          "[RedditLinkPostingEngine] Error creating Reddit post:",
          e,
        );
      });
  }
}
