import {
  ContainerNode,
  IContainer,
  JSONObject,
  JSONValue,
  keywordReplacement,
} from "@ts-flow/core";
import { OpenAIEngineBase } from "./OpenAIEngineBase";

@ContainerNode
export class OpenAIImageEngine extends OpenAIEngineBase {
  private readonly prompt: string;
  private readonly numImages: number;
  private readonly size: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.prompt = config["prompt"] as string;
    this.numImages = config["numImages"] as number;
    this.size = config["size"] as string;
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const prompt = keywordReplacement(this.prompt, payload);
    const response = await this.openAI.images.generate({
      prompt,
      n: this.numImages,
      size:
        this.size === "small"
          ? "256x256"
          : this.size === "medium"
            ? "512x512"
            : "1024x1024",
    });

    if (this.numImages === 1) {
      return response.data[0].url || "error";
    }
    return response.data.map((image) => {
      return { url: image.url || "error" };
    });
  }
}
