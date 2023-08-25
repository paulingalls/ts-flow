import {
  NodeBase,
  ContainerNode,
  IContainer,
  JSONObject,
  keywordReplacement,
  IQueryEngine
} from "@ai-flow/core";
import { OpenAI } from 'openai';

@ContainerNode
export class OpenAIQueryEngine extends NodeBase implements IQueryEngine {
  private readonly systemPrompt: string;
  private readonly userPrompt: string;
  private readonly modelName: string;
  private readonly openAI: OpenAI;
  private readonly dataRoot: string;
  private readonly outputProperty: string;
  private readonly outputEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.systemPrompt = config['systemPrompt'] as string;
    this.userPrompt = config['userPrompt'] as string;
    this.modelName = config['modelName'] as string;
    this.dataRoot = config['dataRoot'] as string;
    this.outputProperty = config['outputProperty'] as string;
    this.outputEventName = config['outputEventName'] as string;

    this.openAI = new OpenAI();
  }

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    const data: JSONObject = payload[this.dataRoot] as JSONObject;

    if (data instanceof Array) {
      const promises: Promise<void>[] = [];
      data.forEach((value) => {
        const item = value as JSONObject;
        promises.push(new Promise((resolve, reject) => {
          this.queryAI(item).then((result) => {
            item[this.outputProperty] = result;
            resolve()
          }).catch(e => {reject(e)})
        }))
      });
      Promise.all(promises).then(() => {
        completeCallback(this.outputEventName, payload);
      }).catch(e => console.error('error executing query ai', e));
    } else {
      this.queryAI(data).then((result) => {
        data[this.outputProperty] = result;
        completeCallback(this.outputEventName, payload);
      }).catch(e => {console.error('error executing query ai', e)});
    }
  }

  async queryAI(payload: JSONObject): Promise<string> {
    const systemPrompt = keywordReplacement(this.systemPrompt, payload);
    const userPrompt = keywordReplacement(this.userPrompt, payload);

    const response = await this.openAI.chat.completions.create({
      model: this.modelName,
      messages: [{role: 'user', content: userPrompt}, {role: 'system', content: systemPrompt}]
    })

    return response.choices[0].message.content || 'error';
  }
}