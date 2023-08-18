import { NodeBase, ContainerNode, IQueryTargetAI, IContainer, JSONObject, keywordReplacement } from "@ai-flow/core";
import { OpenAI } from 'openai';

@ContainerNode
export class OpenAIQueryEngine extends NodeBase implements IQueryTargetAI {
  private systemPrompt: string;
  private userPrompt: string;
  private modelName: string;
  private openAI: OpenAI;
  private dataRoot: string;
  private outputProperty: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.systemPrompt = config['systemPrompt'] as string;
    this.userPrompt = config['userPrompt'] as string;
    this.modelName = config['modelName'] as string;
    this.dataRoot = config['dataRoot'] as string;
    this.outputProperty = config['outputProperty'] as string;

    this.openAI = new OpenAI();
  }

  async sendQuery(payload: JSONObject): Promise<JSONObject> {
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
      await Promise.all(promises);
    } else {
      await this.queryAI(data);
    }

    return payload;
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