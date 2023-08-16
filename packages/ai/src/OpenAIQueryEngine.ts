import { NodeBase, ContainerNode, IQueryTargetAI, IContainer, JSONObject, QueryResponse, keywordReplacement } from "@ai-flow/core";
import { OpenAI } from 'openai';

@ContainerNode
export class OpenAIQueryEngine extends NodeBase implements IQueryTargetAI {
  private systemPrompt: string;
  private userPrompt: string;
  private modelName: string;
  private openAI: OpenAI;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.systemPrompt = config['systemPrompt'] as string;
    this.userPrompt = config['userPrompt'] as string;
    this.modelName = config['modelName'] as string;

    this.openAI = new OpenAI();
  }

  sendQuery(payload: JSONObject): Promise<QueryResponse> {
    return new Promise((resolve, reject) => {
      const systemPrompt = keywordReplacement(this.systemPrompt, payload);
      const userPrompt = keywordReplacement(this.userPrompt, payload);

      this.openAI.chat.completions.create({
        model: this.modelName,
        messages: [{role: 'user', content: userPrompt}, {role: 'system', content: systemPrompt}]
      }).then((response) => {
        const data = response.choices[0];
        resolve({
          role: data.message.role,
          content: data.message.content || '',
          function_call: data.message.function_call,
        })
      }).catch(e => {
        console.log('error calling openai', e);
        reject(e);
      })
    })
  }
}