import {
  ContainerNode,
  IContainer,
  JSONObject, JSONValue,
  keywordReplacement
} from '@ts-flow/core';
import { OpenAIEngineBase } from './OpenAIEngineBase';

@ContainerNode
export class OpenAIChatEngine extends OpenAIEngineBase {
  private readonly systemPrompt: string;
  private readonly userPrompt: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.systemPrompt = config['systemPrompt'] as string;
    this.userPrompt = config['userPrompt'] as string;
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const systemPrompt = keywordReplacement(this.systemPrompt, payload);
    const userPrompt = keywordReplacement(this.userPrompt, payload);
    console.log(payload, systemPrompt, '\n', userPrompt);

    const response = await this.openAI.chat.completions.create({
      model: this.modelName,
      messages: [{role: 'user', content: userPrompt}, {role: 'system', content: systemPrompt}]
    })

    const result = response.choices[0].message.content ?? 'error'

    console.log(result);

    return result as JSONValue;
  }
}