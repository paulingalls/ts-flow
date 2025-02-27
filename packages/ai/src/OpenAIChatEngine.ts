import {
  ContainerNode,
  IContainer,
  JSONObject,
  JSONValue,
  keywordReplacement,
} from "@ts-flow/core";
import { OpenAIEngineBase } from "./OpenAIEngineBase";
import {
  ResponseFormatJSONObject,
  ResponseFormatJSONSchema,
  ResponseFormatText,
} from "openai/resources";

@ContainerNode
export class OpenAIChatEngine extends OpenAIEngineBase {
  private readonly systemPrompt: string;
  private readonly userPrompt: string;
  private readonly responseFormat?:
    | ResponseFormatText
    | ResponseFormatJSONObject
    | ResponseFormatJSONSchema;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.systemPrompt = config["systemPrompt"] as string;
    this.userPrompt = config["userPrompt"] as string;
    this.responseFormat = config["responseFormat"] as unknown as
      | ResponseFormatText
      | ResponseFormatJSONObject
      | ResponseFormatJSONSchema
      | undefined;
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const systemPrompt = keywordReplacement(this.systemPrompt, payload);
    const userPrompt = keywordReplacement(this.userPrompt, payload);
    console.log(payload, systemPrompt, "\n", userPrompt);

    const response = await this.openAI.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: "user", content: userPrompt },
        { role: "system", content: systemPrompt },
      ],
      response_format: this.responseFormat,
    });

    const result = response.choices[0].message.content ?? "error";

    console.log("Chat completion result", result);
    if (
      this.responseFormat?.type === "json_object" ||
      this.responseFormat?.type === "json_schema"
    ) {
      return JSON.parse(result) as JSONValue;
    }
    return result as JSONValue;
  }
}
