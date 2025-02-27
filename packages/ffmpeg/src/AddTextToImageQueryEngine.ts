import {
  ContainerNode,
  IContainer,
  JSONObject,
  JSONValue,
  keywordReplacement,
} from "@ts-flow/core";
import { FfmpegEngineBase } from "./FfmpegEngineBase";
import Ffmpeg from "fluent-ffmpeg";
import path from "path";
import axios from "axios";
import * as fs from "fs";
import { nanoid } from "nanoid";

@ContainerNode
export class AddTextToImageQueryEngine extends FfmpegEngineBase {
  private readonly imageProperty: string;
  private readonly textTemplate: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.imageProperty = config["imageProperty"] as string;
    this.textTemplate = config["textTemplate"] as string;
  }

  runFfmpeg(payload: JSONObject): Promise<JSONValue> {
    const fileName: string = `${nanoid()}.png`;
    const imagePath: string = path.join(process.cwd(), "tmp", fileName);
    const intermediatePath: string = path.join(
      process.cwd(),
      "tmp",
      `int_${fileName}`,
    );
    const outputPath: string = path.join(
      process.cwd(),
      "public",
      "images",
      fileName,
    );

    const text: string = keywordReplacement(this.textTemplate, payload);
    const textChunks = this.splitIntoThreeWordChunks(text);
    const filters = this.getFiltersFromTextChunks(textChunks);

    console.log('trying to add text to image', text, filters);

    return new Promise((resolve, reject) => {
      this.downloadImage(payload[this.imageProperty] as string, imagePath)
        .then(() => {
          Ffmpeg()
            .input(imagePath)
            .complexFilter(
              "[0]split[v0][v1];[v0]format=rgba,geq=r=0:g=0:b=0:a=128[fg];[v1][fg]overlay=format=auto",
            )
            .output(intermediatePath)
            .on("end", () => {
              Ffmpeg()
                .input(intermediatePath)
                .videoFilters(filters)
                .output(outputPath)
                .on("end", () => {
                  console.log("text:", text, "written to image:", outputPath);
                  fs.unlinkSync(imagePath);
                  fs.unlinkSync(intermediatePath);
                  resolve(
                    `https://${process.env.WEB_HOST_NAME}/images/${fileName}`,
                  );
                })
                .on("error", (e) => {
                  reject(e);
                })
                .run();
            })
            .on("error", (e) => {
              reject(e);
            })
            .run();
        })
        .catch((e) => {
          console.error("Error downloading image:", e);
          reject(new Error("Error downloading image"));
        });
    });
  }

  private getFiltersFromTextChunks(textChunks: string[]) {
    return textChunks.map((chunk, index) => {
      return {
        filter: "drawtext",
        options: {
          fontfile: "/vagrant/fonts/LucidaGrande.ttc",
          text: chunk.replace(/'/g, "//'").replace(/:/g, "//:"),
          fontsize: 20,
          fontcolor: "white",
          x: "(main_w/2-text_w/2)",
          y: 50 + index * 30,
          shadowcolor: "black",
          shadowx: 2,
          shadowy: 2,
        },
      };
    });
  }

  async downloadImage(url: string, destination: string): Promise<void> {
    try {
      const response = await axios.get<fs.ReadStream>(url, {
        responseType: "stream",
      });

      const fileStream = fs.createWriteStream(destination);
      response.data.pipe(fileStream);

      return new Promise((resolve, reject) => {
        fileStream.on("finish", () => {
          fileStream.close();
          console.log("Image downloaded successfully to", destination);
          resolve();
        });

        fileStream.on("error", (error) => {
          console.error("Error saving image:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  }

  splitIntoThreeWordChunks(text: string): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(" ");
      chunks.push(chunk);
    }

    return chunks;
  }
}
