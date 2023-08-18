import { IContainer, IQueryWebEngine, JSONObject, NodeBase } from "@ai-flow/core";
import puppeteer, { Browser } from "puppeteer";

export class PuppeteerQueryWebEngine extends NodeBase implements IQueryWebEngine {
  private readonly dataRoot: string;
  private readonly urlPath: string;
  private readonly outputProperty: string;
  private readonly query: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.dataRoot = config['dataRoot'] as string;
    this.urlPath = config['urlPath'] as string;
    this.outputProperty = config['outputProperty'] as string;
    this.query = config['query'] as string;
  }

  async loadAndQueryPage(payload: JSONObject): Promise<JSONObject> {
    const data = payload[this.dataRoot] as JSONObject;
    const browser = await puppeteer.launch({headless: false})

    if (this.urlPath.startsWith('http')) {
      data[this.outputProperty] = await this.scrapeData(browser, this.urlPath, this.query);
    } else if (data instanceof Array) {
      const promises: Promise<void>[] = [];
      data.forEach((value) => {
        const item = value as JSONObject;
        const url = item[this.urlPath] as string;
        promises.push(new Promise<void>((resolve) => {
          this.scrapeData(browser, url, this.query).then((result) => {
            item[this.outputProperty] = result;
            resolve();
          }).catch(e => {console.error(e)})
        }))
      })
      await Promise.all(promises);
    } else {
      const url = data[this.urlPath] as string;
      data[this.outputProperty] = await this.scrapeData(browser, url, this.query);
    }

    return payload;
  }

  async scrapeData(browser: Browser, url: string, query: string): Promise<string> {
    const page = await browser.newPage();
    await page.goto(url);

    let extractedText: string = '';
    if (query === 'allText') {
      extractedText = await page.$eval('*', (el) => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNode(el);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return window.getSelection()?.toString() as string;
      }) as string;
      console.log(extractedText);
    } else {
      console.log('TODO');
    }

    await page.close();

    return extractedText;
  }

}