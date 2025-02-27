import {
  ContainerNode,
  IContainer,
  JSONObject,
  JSONValue,
} from "@ts-flow/core";
import { OpenAIEngineBase } from "./OpenAIEngineBase";
import { AudioResponseFormat } from "openai/src/resources/audio/audio";
import * as fs from "fs";

@ContainerNode
export class OpenAIWhisperEngine extends OpenAIEngineBase {
  private readonly inputProperty: string;
  private readonly audioPrompt: string;
  private readonly responseFormat: AudioResponseFormat;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.inputProperty = config["inputProperty"] as string;
    this.audioPrompt = config["audioPrompt"] as string;
    this.responseFormat =
      (config["responseFormat"] as AudioResponseFormat) || "json";
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const inputFilename: string = payload[this.inputProperty] as string;

    const response = await this.openAI.audio.transcriptions.create({
      model: this.modelName,
      language: "en",
      response_format: this.responseFormat,
      file: fs.createReadStream(inputFilename),
      prompt: this.audioPrompt || "Hello, this is some audio",
    });

    if (
      this.responseFormat === "text" ||
      this.responseFormat === "srt" ||
      this.responseFormat === "vtt"
    ) {
      return response as unknown as JSONValue;
    }
    return response.text || "error";
  }
}
