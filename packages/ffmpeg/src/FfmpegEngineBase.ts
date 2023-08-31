import { IContainer, IQueryEngine, JSONObject, JSONValue, NodeBase } from '@ai-flow/core';
import Ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import FfmpegStatic from "ffmpeg-static";

Ffmpeg.setFfmpegPath(FfmpegStatic || '');

export abstract class FfmpegEngineBase extends NodeBase implements IQueryEngine {
  protected readonly dataRoot: string;
  protected readonly outputProperty: string;
  protected readonly outputEventName: string;
  protected readonly ffmpeg: FfmpegCommand;

  protected constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.dataRoot = config['dataRoot'] as string;
    this.outputProperty = config['outputProperty'] as string;
    this.outputEventName = config['outputEventName'] as string;
    this.ffmpeg = Ffmpeg();
  }

  execute(payload: JSONObject, completeCallback: (completeEventName: string, result: JSONObject) => void): void {
    const data: JSONObject = this.dataRoot ? payload[this.dataRoot] as JSONObject : payload;

    console.log('executing ffmpeg engine for node', this.id);

    if (data instanceof Array) {
      const promises: Promise<void>[] = [];
      data.forEach((value) => {
        const item = value as JSONObject;
        promises.push(new Promise((resolve, reject) => {
          this.runFfmpeg(item).then((result) => {
            item[this.outputProperty] = result;
            resolve()
          }).catch(e => {reject(e)})
        }))
      });
      Promise.all(promises).then(() => {
        completeCallback(this.outputEventName, payload);
      }).catch(e => console.error('error executing ffmpeg', e));
    } else {
      this.runFfmpeg(data).then((result) => {
        data[this.outputProperty] = result;
        completeCallback(this.outputEventName, payload);
      }).catch(e => {console.error('error executing ffmpeg', e)});
    }
  }

  abstract runFfmpeg(payload: JSONObject): Promise<JSONValue>;
}