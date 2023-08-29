import {
  ContainerNode,
  IContainer,
  JSONObject, JSONValue
} from '@ai-flow/core';
import { OpenAIEngineBase } from './OpenAIEngineBase';
import { toFile } from 'openai';

@ContainerNode
export class OpenAIWhisperEngine extends OpenAIEngineBase {
  private readonly inputProperty: string;
  private readonly audioPrompt: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.inputProperty = config['inputProperty'] as string;
    this.audioPrompt = config['audioPrompt'] as string;
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const fileBuffer: Buffer = payload[this.inputProperty] as unknown as Buffer;

    const response = await this.openAI.audio.transcriptions.create({
      model: this.modelName,
      language: 'en',
      response_format: 'json',
      file: await toFile(fileBuffer, 'podcast.mp3'),
      prompt: this.audioPrompt || 'Hello, this is some audio'
    })

    return response.text || 'error';
  }
}