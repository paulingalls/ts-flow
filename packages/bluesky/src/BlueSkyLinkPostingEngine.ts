import type { IContainer, IQueryEngine, JSONObject } from "@ts-flow/core";
import { ContainerNode, keywordReplacement, NodeBase } from "@ts-flow/core";
import axios from "axios";
import { BlueskyAuthManager } from "./auth";

interface LinkFacet {
  index: { byteStart: number; byteEnd: number };
  features: [{ $type: "app.bsky.richtext.facet#link"; uri: string }];
}

interface ImageEmbed {
  $type: "app.bsky.embed.external";
  external: {
    uri: string;
    title: string;
    description: string;
    thumb: {
      $type: "blob";
      ref: { $link: string };
      mimeType: string;
      size: number;
    };
  };
}

interface BlobResponse {
  blob: {
    ref: { $link: string };
  };
}

@ContainerNode
export class BlueSkyLinkPostingEngine extends NodeBase implements IQueryEngine {
  private readonly apiUrl: string;
  private readonly identifier: string;
  private readonly password: string;
  private readonly postText: string;
  private readonly postUrl: string;
  private readonly utmCampaign: string;
  private readonly outputEventName: string;
  private readonly outputProperty: string;
  private readonly authManager: BlueskyAuthManager;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.apiUrl = (config["apiUrl"] as string) || "https://bsky.social/xrpc";
    this.identifier = keywordReplacement(config["identifier"] as string, {});
    this.password = keywordReplacement(config["password"] as string, {});
    this.postText = config["text"] as string;
    this.postUrl = config["url"] as string;
    this.utmCampaign = (config["utmCampaign"] as string) || "ts-flow";
    this.outputEventName = config["outputEventName"] as string;
    this.outputProperty = config["outputProperty"] as string;
    this.authManager = new BlueskyAuthManager({
      identifier: this.identifier,
      password: this.password,
      apiUrl: this.apiUrl,
    });
  }

  private async uploadImage(
    imageUrl: string,
    token: string,
  ): Promise<{ ref: { $link: string }; mimeType: string; size: number }> {
    // Download the image
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(imageResponse.data);

    // Upload to Bluesky
    const uploadResponse = await axios.post<BlobResponse>(
      `${this.apiUrl}/com.atproto.repo.uploadBlob`,
      buffer,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": imageResponse.headers["content-type"] as string,
        },
      },
    );

    return {
      ref: { $link: uploadResponse.data.blob.ref.$link },
      mimeType: imageResponse.headers["content-type"] as string,
      size: buffer.length,
    };
  }

  private async getOgData(
    url: string,
  ): Promise<{ image?: string; description?: string; title?: string }> {
    try {
      const response = await axios.get(url);
      const html = response.data as string;

      // Helper function to get meta content
      const getMetaContent = (property: string): string | undefined => {
        const patterns = [
          new RegExp(
            `<meta[^>]*property="${property}"[^>]*content="([^"]*)"[^>]*>`,
            "i",
          ),
          new RegExp(
            `<meta[^>]*content="([^"]*)"[^>]*property="${property}"[^>]*>`,
            "i",
          ),
          new RegExp(
            `<meta[^>]*name="${property}"[^>]*content="([^"]*)"[^>]*>`,
            "i",
          ),
          new RegExp(
            `<meta[^>]*content="([^"]*)"[^>]*name="${property}"[^>]*>`,
            "i",
          ),
        ];

        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) return match[1];
        }
        return undefined;
      };

      // Try different meta tags for each property
      const description =
        getMetaContent("og:description") ||
        getMetaContent("description") ||
        getMetaContent("twitter:description");

      const image =
        getMetaContent("og:image") || getMetaContent("twitter:image");

      const title =
        getMetaContent("og:title") ||
        getMetaContent("twitter:title") ||
        getMetaContent("title");

      console.log("[BlueSkyLinkPostingEngine] Found metadata:", {
        description: description?.substring(0, 100) + "...",
        image: image,
        title: title,
      });

      return {
        image,
        description,
        title,
      };
    } catch (error) {
      console.error(
        "[BlueSkyLinkPostingEngine] Error fetching OG data:",
        error,
      );
      return {};
    }
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    console.log("[BlueSkyLinkPostingEngine] Executing");

    const token = await this.authManager.getValidToken();
    const processedText = keywordReplacement(this.postText, payload);
    const processedUrl = keywordReplacement(this.postUrl, payload);

    const url = new URL(processedUrl);
    if (!url.searchParams.has("utm_source")) {
      url.searchParams.append("utm_source", "bluesky");
    }
    if (!url.searchParams.has("utm_medium")) {
      url.searchParams.append("utm_medium", "social");
    }
    if (!url.searchParams.has("utm_campaign")) {
      url.searchParams.append("utm_campaign", this.utmCampaign);
    }

    const finalUrl = url.toString();
    const text = processedText;

    // Create facet for the link
    const facets: LinkFacet[] = [
      {
        index: {
          byteStart: 0,
          byteEnd: text.length,
        },
        features: [
          {
            $type: "app.bsky.richtext.facet#link",
            uri: finalUrl,
          },
        ],
      },
    ];

    // Try to get and upload the image
    let embed: ImageEmbed | undefined;
    const ogData = await this.getOgData(finalUrl);
    if (ogData.image) {
      try {
        const imageData = await this.uploadImage(ogData.image, token);
        embed = {
          $type: "app.bsky.embed.external",
          external: {
            uri: finalUrl,
            title: text,
            description: ogData.description || "",
            thumb: {
              $type: "blob",
              ref: { $link: imageData.ref.$link },
              mimeType: imageData.mimeType,
              size: imageData.size,
            },
          },
        };
      } catch (error) {
        console.error(
          "[BlueSkyLinkPostingEngine] Error uploading image:",
          error,
        );
      }
    }

    const postBody = {
      collection: "app.bsky.feed.post",
      repo: await this.authManager.getDid(),
      record: {
        text: text,
        facets: facets,
        embed: embed,
        createdAt: new Date().toISOString(),
        $type: "app.bsky.feed.post",
      },
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/com.atproto.repo.createRecord`,
        postBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (this.outputProperty) {
        payload[this.outputProperty] = response.data as JSONObject;
      } else {
        payload = response.data as JSONObject;
      }

      console.log(
        "[BlueSkyLinkPostingEngine] Post response:",
        JSON.stringify(response.data),
      );
      completeCallback(this.outputEventName, payload);
    } catch (error) {
      console.error("[BlueSkyLinkPostingEngine] Error creating post:", error);
      throw error;
    }
  }
}
