import {
  ContainerNode,
  IContainer,
  JSONObject, JSONValue
} from '@ts-flow/core';
import { OpenAIEngineBase } from './OpenAIEngineBase';
import { toFile } from 'openai';
import { AudioResponseFormat } from "openai/src/resources/audio/audio";

@ContainerNode
export class OpenAIWhisperEngine extends OpenAIEngineBase {
  private readonly inputProperty: string;
  private readonly audioPrompt: string;
  private readonly responseFormat: AudioResponseFormat;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.inputProperty = config['inputProperty'] as string;
    this.audioPrompt = config['audioPrompt'] as string;
    this.responseFormat = config['responseFormat'] as AudioResponseFormat || 'json';
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const fileBuffer: Buffer = payload[this.inputProperty] as unknown as Buffer;

    console.log("buffer", fileBuffer.length);

    const response = await this.openAI.audio.transcriptions.create({
      model: this.modelName,
      language: 'en',
      response_format: this.responseFormat,
      file: await toFile(fileBuffer, 'podcast.mp3'),
      prompt: this.audioPrompt || 'Hello, this is some audio'
    })

    if (this.responseFormat === 'text' || this.responseFormat === 'srt' || this.responseFormat === 'vtt') {
      return response as unknown as JSONValue;
    }
    return response.text || 'error';
  }
}