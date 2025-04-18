import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  keywordReplacement,
  NodeBase,
  injectDataIntoJSONObject,
} from "@ts-flow/core";
import axios, { AxiosHeaders } from "axios";
import fs from "fs";
import path from "path";

@ContainerNode
export class HttpGetFileQueryEngine extends NodeBase implements IQueryEngine {
  private readonly urlTemplate: string;
  private readonly outputEventName: string;
  private readonly outputProperty: string;
  private readonly headerSchema: JSONObject;
  private readonly outputPathTemplate: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlTemplate = config["urlTemplate"] as string;
    this.outputEventName = config["outputEventName"] as string;
    this.outputProperty = config["outputProperty"] as string;
    this.outputPathTemplate = config["outputPathTemplate"] as string;
    this.headerSchema = config["headerSchema"] as JSONObject || {
      "Content-Type": "application/octet-stream"
    };
  }

  private async downloadFile(item: JSONObject): Promise<void> {
    const url: string = keywordReplacement(this.urlTemplate, item);
    const outputPath: string = keywordReplacement(this.outputPathTemplate, item);
    const headers: AxiosHeaders = injectDataIntoJSONObject(
      item,
      this.headerSchema,
    ) as AxiosHeaders;
    
    try {
      const response = await axios.get(url, { 
        headers,
        responseType: 'arraybuffer'
      });

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(outputPath, Buffer.from(response.data));

      if (this.outputProperty) {
        item[this.outputProperty] = outputPath;
      } else {
        item["filePath"] = outputPath;
      }
    } catch (e) {
      console.error("error downloading file", e);
    }
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    if (Array.isArray(payload)) {
      await Promise.all(
        payload.map((item: JSONObject) => this.downloadFile(item))
      );
    } else {
      await this.downloadFile(payload);
    }

    completeCallback(this.outputEventName, payload);
  }
}
