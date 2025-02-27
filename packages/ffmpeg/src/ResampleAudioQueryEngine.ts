import {
  ContainerNode,
  IContainer,
  JSONObject,
  JSONValue,
} from "@ts-flow/core";
import { FfmpegEngineBase } from "./FfmpegEngineBase";
import Ffmpeg from "fluent-ffmpeg";
import path from "node:path";
import * as fs from "node:fs";

@ContainerNode
export class ResampleAudioQueryEngine extends FfmpegEngineBase {
  private readonly inputProperty: string;
  private readonly keepOriginalFile: boolean;
  private readonly audioSampleRate: number;
  private readonly audioChannels: number;
  private readonly audioCodec: string;
  private readonly audioFileFormat: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);

    this.inputProperty = config["inputProperty"] as string;
    this.keepOriginalFile = (config["keepOriginalFile"] as boolean) ?? false;
    this.audioSampleRate = config["audioSampleRate"] as number;
    this.audioChannels = config["audioChannels"] as number;
    this.audioCodec = config["audioCodec"] as string;
    this.audioFileFormat = config["audioFileFormat"] as string;
  }

  async runFfmpeg(payload: JSONObject): Promise<JSONValue> {
    const inputFilePath: string = payload[this.inputProperty] as string;
    const extension = path.extname(inputFilePath);
    const outputFilePath = inputFilePath.replace(
      extension,
      `-${this.audioCodec}.${this.audioFileFormat}`,
    );
    await this.resampleFile(inputFilePath, outputFilePath);
    if (!this.keepOriginalFile) {
      fs.unlinkSync(inputFilePath);
    }
    return outputFilePath;
  }

  protected resampleFile(
    inputFilePath: string,
    outputFilePath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      Ffmpeg(inputFilePath)
        .audioCodec(this.audioCodec)
        .audioChannels(this.audioChannels)
        .audioFrequency(this.audioSampleRate)
        .toFormat(this.audioFileFormat)
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          console.error("Error resampling audio:", err);
          reject(err);
        })
        .save(outputFilePath);
    });
  }
}
