import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  keywordReplacement,
  NodeBase,
  getJSONObjectFromPath,
} from "@ts-flow/core";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";

@ContainerNode
export class RSSQueryEngine extends NodeBase implements IQueryEngine {
  private readonly urlTemplate: string;
  private readonly urlParameter: string;
  private readonly dataRoot: string;
  private readonly outputEventName: string;
  private readonly outputProperty: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config["urlTemplate"] as string;
    this.urlParameter = config["urlParameter"] as string;
    this.dataRoot = config["dataRoot"] as string;
    this.outputEventName = config["outputEventName"] as string;
    this.outputProperty = config["outputProperty"] as string;
  }

  private extractMetadata(html: string): JSONObject {
    const $ = cheerio.load(html);

    const getMetaContent = (selectors: string[]): string | undefined => {
      for (const selector of selectors) {
        const content = $(`meta[${selector}]`).attr("content");
        if (content) return content;
      }
      return undefined;
    };

    return {
      title:
        getMetaContent([
          'property="og:title"',
          'name="twitter:title"',
          'name="title"',
        ]) || $("title").text(),

      description:
        getMetaContent([
          'property="og:description"',
          'name="twitter:description"',
          'name="description"',
        ]) || $("description").text(),

      image:
        getMetaContent([
          'property="og:image"',
          'name="twitter:image"',
          'property="og:image:url"',
          'name="image"',
        ]) || "",

      keywords:
        getMetaContent(['name="keywords"', 'property="article:tag"']) || "",
    };
  }

  private async fetchAndProcessRSS(
    url: string,
    source?: JSONObject,
  ): Promise<JSONObject[]> {
    const rssResponse = await axios.get(url);
    const parser = new XMLParser();
    const rssData = parser.parse(rssResponse.data as string) as JSONObject;

    const items =
      (((rssData.rss as JSONObject)?.channel as JSONObject)
        ?.item as JSONObject[]) || [];

    // Process each item to add metadata
    for (const item of items) {
      if (typeof item.link === "string") {
        try {
          const pageUrl =
            new URL(item.link).origin + new URL(item.link).pathname;
          const pageResponse = await axios.get(pageUrl);
          const metadata = this.extractMetadata(pageResponse.data as string);

          // convert published date to ISO 8601 format
          if (typeof item.pubDate === "string") {
            const date = new Date(item.pubDate);
            if (!isNaN(date.getTime())) {
              const formattedPublishedDate = date.toISOString();
              Object.assign(item, {
                pubDate: formattedPublishedDate,
              });
            }
          }

          // Merge metadata with existing item data
          Object.assign(item, {
            link: pageUrl,
            image: metadata.image,
            keywords: metadata.keywords,
            description: item.description || metadata.description,
            title: item.title || metadata.title,
            ...(source && {
              accountId: source.account_id,
              dataSourceId: source.id,
            }),
          });
        } catch (error) {
          console.error(
            `Error fetching metadata for ${String(item.link)}:`,
            error,
          );
        }
      }
    }

    return items;
  }

  private createRSSStructure(items: JSONObject[]): JSONObject {
    return {
      rss: {
        channel: {
          item: items,
        },
      },
    };
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    try {
      let allItems: JSONObject[] = [];
      let lastRssData: JSONObject | null = null;

      if (this.dataRoot) {
        // Multiple URLs scenario
        const data = getJSONObjectFromPath(this.dataRoot, payload);
        const sources = Array.isArray(data) ? data : [data];

        for (const source of sources as JSONObject[]) {
          const urlParam = this.urlParameter;
          if (!urlParam || typeof source !== "object" || !source[urlParam]) {
            console.warn("Skipping source - missing URL parameter");
            continue;
          }

          const sourceUrl = source[urlParam] as string;
          const rssItems = await this.fetchAndProcessRSS(sourceUrl, source);
          allItems = [...allItems, ...rssItems];
          lastRssData = lastRssData || this.createRSSStructure(rssItems);
        }
      } else {
        // Single URL scenario
        const url = keywordReplacement(this.urlTemplate, payload);
        allItems = await this.fetchAndProcessRSS(url);
        lastRssData = this.createRSSStructure(allItems);
      }

      if (!lastRssData) {
        throw new Error("No RSS data was processed");
      }

      // Create final structure with all items
      const enrichedRss: JSONObject = {
        ...lastRssData,
        rss: {
          ...(lastRssData.rss as JSONObject),
          channel: {
            ...((lastRssData.rss as JSONObject).channel as JSONObject),
            item: allItems,
          },
        },
      };

      if (this.outputProperty) {
        payload[this.outputProperty] = enrichedRss;
      } else {
        payload = { ...payload, ...enrichedRss };
      }

      completeCallback(this.outputEventName, payload);
    } catch (error) {
      console.error("Error processing RSS feed:", error);
      throw error;
    }
  }
}
