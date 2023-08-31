import { ContainerNode, IContainer, JSONObject, JSONValue } from '@ai-flow/core';
import * as fs from 'fs';
import path from 'path';
import { FfmpegEngineBase } from './FfmpegEngineBase';
import { nanoid } from 'nanoid'

@ContainerNode
export class AudioTrimQueryEngine extends FfmpegEngineBase {
  private readonly inputProperty: string;
  private readonly trimLength: number;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.inputProperty = config['inputProperty'] as string;
    this.trimLength = config['trimLength'] as number;
  }

  runFfmpeg(payload: JSONObject): Promise<JSONValue> {
    return new Promise((resolve, reject) => {
      const buffer: Buffer = payload[this.inputProperty] as unknown as Buffer;
      const fileName: string = `${nanoid()}.mp3`;
      const filePath: string = path.join(process.cwd(), 'pods', fileName);
      const outputPath: string = path.join(process.cwd(), 'pods', `trimmed_${fileName}`);
      fs.writeFileSync(filePath, buffer);
      this.ffmpeg
        .input(filePath)
        .setStartTime('00:00:00')
        .setDuration('00:05:00')
        .output(outputPath)
        .on('end', () => {
          console.log('Trimming complete');
          const file = fs.readFileSync(outputPath);
//        fs.unlinkSync(outputPath);
          resolve(file as unknown as JSONValue);
        })
        .on('error', (e) => {
          reject(e);
        })
        .run();
    })
  }
}