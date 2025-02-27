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
  private readonly keepTrimmedFiles: boolean;
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
    this.keepTrimmedFiles = (config["keepTrimmedFiles"] as boolean) ?? false;
    this.trimmedFilenameProperty = config["trimmedFilenameProperty"] as string;
  }

  async runFfmpeg(payload: JSONObject): Promise<JSONValue> {
    const buffer: Buffer = payload[this.inputProperty] as unknown as Buffer;
    const fileId: string = nanoid();
    const fileName: string = `${fileId}.mp3`;
    const inputFilePath: string = path.join(
      process.cwd(),
      this.fileFolderName,
      fileName,
    );
    const extension = path.extname(inputFilePath);
    fs.writeFileSync(inputFilePath, buffer);
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
        return await this.trimAudioFile(
          inputFilePath,
          path.join(process.cwd(), outputFileSubPath),
          trimStart,
          trimDuration,
        );
      }
    }

    const outputFilePath: string = path.join(
      process.cwd(),
      this.fileFolderName,
      `clip_${fileId}${extension}`,
    );
    return this.trimAudioFile(
      inputFilePath,
      outputFilePath,
      this.trimStart,
      this.trimLength,
    );
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
  ): Promise<JSONValue> {
    const keepTrimmedFile = this.keepTrimmedFiles;
    return new Promise((resolve, reject) => {
      Ffmpeg()
        .input(inputFilePath)
        .setStartTime(trimStart)
        .setDuration(trimDuration)
        .output(outputFilePath)
        .on("end", () => {
          console.log("Trimming complete");
          const file = fs.readFileSync(outputFilePath);
          if (!keepTrimmedFile) {
            fs.unlinkSync(outputFilePath);
          }
          resolve(file as unknown as JSONValue);
        })
        .on("error", (e) => {
          console.error("Error trimming audio file", e);
          reject(e);
        })
        .run();
    });
  }
}
