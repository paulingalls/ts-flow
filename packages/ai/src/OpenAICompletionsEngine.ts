import {
  ContainerNode,
  IContainer,
  JSONObject, JSONValue,
  keywordReplacement
} from '@ai-flow/core';
import { OpenAIEngineBase } from './OpenAIEngineBase';

@ContainerNode
export class OpenAICompletionsEngine extends OpenAIEngineBase {
  private readonly prompt: string;
  private readonly numCompletions: number;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.prompt = config['prompt'] as string;
    this.numCompletions = config['numCompletions'] as number || 1;
    this.maxTokens = config['maxTokens'] as number || 256;
    this.temperature = config['temperature'] as number || 1;
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const prompt = keywordReplacement(this.prompt, payload);

    const response = await this.openAI.completions.create({
      model: this.modelName,
      prompt,
      n: this.numCompletions,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    })

    return response.choices.map((completion) => {
      return { text: completion.text }
    });
  }
}