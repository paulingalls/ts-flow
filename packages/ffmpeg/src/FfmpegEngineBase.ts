import {
  IContainer,
  IQueryEngine,
  JSONObject,
  JSONValue,
  NodeBase,
} from "@ts-flow/core";
import Ffmpeg from "fluent-ffmpeg";
import FfmpegStatic from "ffmpeg-static";

Ffmpeg.setFfmpegPath(FfmpegStatic || "");

export abstract class FfmpegEngineBase
  extends NodeBase
  implements IQueryEngine
{
  protected readonly outputProperty: string;
  protected readonly outputEventName: string;

  protected constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.outputProperty = config["outputProperty"] as string;
    this.outputEventName = config["outputEventName"] as string;
  }

  async execute(
    data: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    console.log("executing ffmpeg engine for node", this.id);

    if (data instanceof Array) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i] as JSONObject;
        item[this.outputProperty] = await this.runFfmpeg(item);
      }
      completeCallback(this.outputEventName, data);
    } else {
      data[this.outputProperty] = await this.runFfmpeg(data);
      completeCallback(this.outputEventName, data);
    }
  }

  abstract runFfmpeg(data: JSONObject): Promise<JSONValue>;
}
