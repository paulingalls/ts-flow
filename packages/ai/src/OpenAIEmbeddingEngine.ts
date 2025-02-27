import {
  ContainerNode,
  IContainer,
  JSONObject,
  JSONValue,
} from "@ts-flow/core";
import { OpenAIEngineBase } from "./OpenAIEngineBase";

@ContainerNode
export class OpenAIEmbeddingEngine extends OpenAIEngineBase {
  private readonly keyToEmbed: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.keyToEmbed = config["keyToEmbed"] as string;
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const response = await this.openAI.embeddings.create({
      input: payload[this.keyToEmbed] as string,
      model: this.modelName,
    });
    return response.data[0].embedding;
  }
}
