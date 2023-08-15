import { NodeBase, ContainerNode, IQueryTargetAI, IContainer, JSONObject, QueryResponse } from "@ai-flow/core";
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
      const systemKeywords = this.extractKeywords(this.systemPrompt);
      let systemPrompt = this.systemPrompt.slice();
      const userKeywords = this.extractKeywords(this.userPrompt);
      let userPrompt = this.userPrompt.slice();
      
      systemKeywords.forEach((keyword) => {
        systemPrompt = systemPrompt.replace('${' + keyword + '}', payload[keyword] as string);
      })
      userKeywords.forEach((keyword) => {
        console.log(keyword, payload[keyword]);
        userPrompt = userPrompt.replace('${' + keyword + '}', payload[keyword] as string);
      })

      console.log('USER_PROMPT', payload, userPrompt, userKeywords);

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

  private extractKeywords(input: string): string[] {
    const regex = /\${(\w+)}/g;
    const keywords: string[] = [];

    let match;
    while ((match = regex.exec(input)) !== null) {
      keywords.push(match[1]);
    }

    return keywords;
  }

}