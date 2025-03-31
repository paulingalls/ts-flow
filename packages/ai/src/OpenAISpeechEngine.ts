import {
  ContainerNode,
  IContainer,
  JSONObject,
  JSONValue,
  keywordReplacement,
} from "@ts-flow/core";
import { OpenAIEngineBase } from "./OpenAIEngineBase";
import * as fs from "fs";
import * as path from "path";

type Voice = 'alloy'
  | 'ash'
  | 'ballad'
  | 'coral'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'sage'
  | 'shimmer'
  | 'verse';

type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

@ContainerNode
export class OpenAISpeechEngine extends OpenAIEngineBase {
  private readonly text: string;
  private readonly voice: string;
  private readonly outputDirectory: string;
  private readonly instructions: string;
  private readonly audioFormat: AudioFormat;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.text = config["text"] as string;
    this.voice = (config["voice"] as string) || "alloy";
    this.instructions = (config["instructions"] as string) || "";
    this.outputDirectory = (config["outputDirectory"] as string) || "./output";
    this.audioFormat = (config["audioFormat"] as AudioFormat) || "mp3";
  }

  async queryAI(payload: JSONObject): Promise<JSONValue> {
    const text = keywordReplacement(this.text, payload);
    const instructions = keywordReplacement(this.instructions, payload);
    const outputDirectory = keywordReplacement(this.outputDirectory, payload);

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDirectory)) {
      fs.mkdirSync(this.outputDirectory, { recursive: true });
    }

    // Generate a unique filename based on timestamp
    const timestamp = new Date().getTime();
    const filename = `speech_${timestamp}.${this.audioFormat}`;
    const outputPath = path.join(outputDirectory, filename);

    const response = await this.openAI.audio.speech.create({
      model: this.modelName,
      voice: this.voice as Voice,
      instructions: instructions,
      input: text,
      response_format: this.audioFormat,
    });

    // Convert the response to a buffer and save it
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(outputPath, buffer);
    
    return {
      filepath: outputPath,
      filename: filename,
    };
  }
} 