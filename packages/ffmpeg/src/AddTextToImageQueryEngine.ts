import { ContainerNode, IContainer, JSONObject, JSONValue, keywordReplacement } from '@ai-flow/core';
import { FfmpegEngineBase } from './FfmpegEngineBase';
import path from 'path';
import axios from 'axios';
import * as fs from 'fs';
import { nanoid } from 'nanoid'

@ContainerNode
export class AddTextToImageQueryEngine extends FfmpegEngineBase {
  private readonly imageProperty: string;
  private readonly textTemplate: string;
  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.imageProperty = config['imageProperty'] as string;
    this.textTemplate = config['textTemplate'] as string;
  }

  runFfmpeg(payload: JSONObject): Promise<JSONValue> {
    const text: string = keywordReplacement(this.textTemplate, payload);
    const fileName: string = `${nanoid()}.png`;
    const imagePath: string = path.join(process.cwd(), 'tmp', fileName);
    const outputPath: string = path.join(process.cwd(), 'public', fileName)
    return new Promise((resolve, reject) => {
      this.downloadImage(payload[this.imageProperty] as string, imagePath).then(() => {
        this.ffmpeg
          .input(imagePath)
          .videoFilter([{
            filter: 'drawtext',
            options: {
              fontfile:'/vagrant/fonts/LucidaGrande.ttc',
              text: text,
              fontsize: 20,
              fontcolor: 'white',
              x: '(main_w/2-text_w/2)',
              y: 50,
              shadowcolor: 'black',
              shadowx: 2,
              shadowy: 2
            }
          }])
          .output(outputPath)
          .on('end', () => {
            //fs.unlinkSync(imagePath);
            resolve(outputPath);
          })
          .on('error', (e) => {
            reject(e);
          })
          .run();
      }).catch(e => reject(e))
    })
  }

  async downloadImage(url: string, destination: string): Promise<void> {
    try {
      const response = await axios.get<fs.ReadStream>(url, { responseType: 'stream' });

      const fileStream = fs.createWriteStream(destination);
      response.data.pipe(fileStream);

      return new Promise((resolve, reject) => {
        fileStream.on('finish', () => {
          fileStream.close();
          console.log('Image downloaded successfully.');
          resolve();
        });

        fileStream.on('error', error => {
          console.error('Error saving image:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };
}