import {
  ContainerNode,
  getJSONObjectFromPath,
  IContainer,
  JSONObject,
  JSONValue,
} from "@ts-flow/core";
import * as fs from "fs";
import path from "path";
import { FfmpegEngineBase } from "./FfmpegEngineBase";
import Ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import moment from "moment";

@ContainerNode
export class AudioTrimQueryEngine extends FfmpegEngineBase {
  private readonly inputProperty: string;
  private readonly fileFolderName: string;
  private readonly trimLength: string;
  private readonly trimStart: string;
  private readonly trimRoot: string;
  private readonly trimStartProperty: string;
  private readonly trimStopProperty: string;
  private readonly keepOriginalFile: boolean;
  private readonly trimmedFilenameProperty: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.inputProperty = config["inputProperty"] as string;
    this.fileFolderName = (config["fileFolderName"] as string) ?? "pods";
    this.trimStart = (config["trimStart"] as string) ?? "00:00:00";
    this.trimLength = (config["trimLength"] as string) ?? "00:05:00";
    this.trimRoot = config["trimRoot"] as string;
    this.trimStartProperty = config["trimStartProperty"] as string;
    this.trimStopProperty = config["trimStopProperty"] as string;
    this.keepOriginalFile = (config["keepOriginalFile"] as boolean) ?? false;
    this.trimmedFilenameProperty = config["trimmedFilenameProperty"] as string;
  }

  async runFfmpeg(payload: JSONObject): Promise<JSONValue> {
    const inputFilePath: string = payload[this.inputProperty] as string;
    const extension = path.extname(inputFilePath);

    const fileId: string = nanoid();
    fs.mkdirSync(path.join(process.cwd(), this.fileFolderName, fileId));

    if (this.trimRoot && this.trimStartProperty) {
      const trimData: JSONObject = getJSONObjectFromPath(
        this.trimRoot,
        payload,
      );
      console.log("trimData", trimData);
      const results: JSONValue[] = [];
      if (trimData instanceof Array) {
        for (let i = 0; i < trimData.length; i++) {
          const item = trimData[i] as JSONObject;
          const trimStart = item[this.trimStartProperty] as string;
          const trimStop = item[this.trimStopProperty] as string;
          const trimDuration = this.calculateDuration(trimStart, trimStop);
          console.log("debug", trimStart, trimStop, trimDuration);

          const outputFileSubPath: string = path.join(
            this.fileFolderName,
            fileId,
            `clip_${i}${extension}`,
          );
          item[this.trimmedFilenameProperty] = outputFileSubPath;
          results.push(
            await this.trimAudioFile(
              inputFilePath,
              path.join(process.cwd(), outputFileSubPath),
              trimStart,
              trimDuration,
            ),
          );
        }
        if (!this.keepOriginalFile) {
          fs.unlinkSync(inputFilePath);
        }
        return results;
      } else {
        const trimStart = trimData[this.trimStartProperty] as string;
        const trimStop = trimData[this.trimStopProperty] as string;
        const trimDuration = this.calculateDuration(trimStart, trimStop);

        const outputFileSubPath: string = path.join(
          this.fileFolderName,
          fileId,
          `clip${extension}`,
        );
        trimData[this.trimmedFilenameProperty] = outputFileSubPath;
        const result = await this.trimAudioFile(
          inputFilePath,
          path.join(process.cwd(), outputFileSubPath),
          trimStart,
          trimDuration,
        );
        if (!this.keepOriginalFile) {
          fs.unlinkSync(inputFilePath);
        }
        return result;
      }
    }

    const outputFilePath: string = path.join(
      process.cwd(),
      this.fileFolderName,
      `clip_${fileId}${extension}`,
    );
    console.log(
      "debug",
      inputFilePath,
      outputFilePath,
      this.trimStart,
      this.trimLength,
    );
    const result = await this.trimAudioFile(
      inputFilePath,
      outputFilePath,
      this.trimStart,
      this.trimLength,
    );
    if (!this.keepOriginalFile) {
      fs.unlinkSync(inputFilePath);
    }
    return result;
  }

  calculateDuration(trimStart: string, trimStop: string): string {
    const start = moment.duration(trimStart);
    const stop = moment.duration(trimStop);
    const duration = stop.subtract(start);
    return moment.utc(duration.asMilliseconds()).format("HH:mm:ss.SSS");
  }

  trimAudioFile(
    inputFilePath: string,
    outputFilePath: string,
    trimStart: string,
    trimDuration: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      Ffmpeg()
        .input(inputFilePath)
        .setStartTime(trimStart)
        .setDuration(trimDuration)
        .output(outputFilePath)
        .on("end", () => {
          console.log("Trimming complete");
          resolve(outputFilePath);
        })
        .on("error", (e) => {
          console.error("Error trimming audio file", e);
          reject(e);
        })
        .run();
    });
  }
}
