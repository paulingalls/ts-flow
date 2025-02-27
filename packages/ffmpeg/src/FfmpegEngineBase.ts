import {
  getJSONObjectFromPath,
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
  protected readonly dataRoot: string;
  protected readonly outputProperty: string;
  protected readonly outputEventName: string;

  protected constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.dataRoot = config["dataRoot"] as string;
    this.outputProperty = config["outputProperty"] as string;
    this.outputEventName = config["outputEventName"] as string;
  }

  async execute(
    payload: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    const data: JSONObject = this.dataRoot
      ? getJSONObjectFromPath(this.dataRoot, payload)
      : payload;

    console.log("executing ffmpeg engine for node", this.id);

    if (data instanceof Array) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i] as JSONObject;
        item[this.outputProperty] = await this.runFfmpeg(item);
      }
      completeCallback(this.outputEventName, payload);
    } else {
      data[this.outputProperty] = await this.runFfmpeg(data);
      completeCallback(this.outputEventName, payload);
    }
  }

  abstract runFfmpeg(payload: JSONObject): Promise<JSONValue>;
}
