import {
  ContainerNode,
  IContainer,
  IQueryEngine,
  JSONObject,
  NodeBase,
} from "@ts-flow/core";
import puppeteer, { Browser } from "puppeteer";

@ContainerNode
export class PuppeteerQueryWebEngine extends NodeBase implements IQueryEngine {
  private readonly urlPath: string;
  private readonly outputProperty: string;
  private readonly query: string;
  private readonly outputEventName: string;

  constructor(id: string, container: IContainer, config: JSONObject) {
    super(id, container, config);
    this.urlPath = config["urlPath"] as string;
    this.outputProperty = config["outputProperty"] as string;
    this.query = config["query"] as string;
    this.outputEventName = config["outputEventName"] as string;
  }

  async execute(
    data: JSONObject,
    completeCallback: (completeEventName: string, result: JSONObject) => void,
  ): Promise<void> {
    return puppeteer
      .launch({ headless: false })
      .then((browser) => {
        if (this.urlPath.startsWith("http")) {
          this.scrapeData(browser, this.urlPath, this.query)
            .then((result) => {
              if (result) {
                data[this.outputProperty] = result;
              }
              completeCallback(this.outputEventName, data);
            })
            .catch((e) => {
              console.error("error scraping data", e);
            });
        } else if (data instanceof Array) {
          const promises: Promise<void>[] = [];
          data.forEach((value) => {
            const item = value as JSONObject;
            const url = item[this.urlPath] as string;
            promises.push(
              new Promise<void>((resolve) => {
                this.scrapeData(browser, url, this.query)
                  .then((result) => {
                    if (result) {
                      item[this.outputProperty] = result;
                    }
                    resolve();
                  })
                  .catch((e) => {
                    console.error(e);
                  });
              }),
            );
          });
          Promise.all(promises)
            .then(() => {
              completeCallback(this.outputEventName, data);
            })
            .catch((e) => {
              console.error("error scraping data", e);
            });
        } else {
          const url = data[this.urlPath] as string;
          this.scrapeData(browser, url, this.query)
            .then((result) => {
              data[this.outputProperty] = result;
              completeCallback(this.outputEventName, data);
            })
            .catch((e) => {
              console.error("error scraping data", e);
            });
        }
      })
      .catch((e) => {
        console.error("error launching puppeteer", e);
      });
  }

  async scrapeData(
    browser: Browser,
    url: string,
    query: string,
  ): Promise<string> {
    const page = await browser.newPage();
    let extractedText: string = "";

    try {
      await page.goto(url, { timeout: 60000 });
    } catch (e) {
      console.log("error loading page", e);
      return extractedText;
    }

    if (query === "allText") {
      try {
        extractedText = await page.$eval("*", (el) => {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNode(el);
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          return window.getSelection()?.toString() as string;
        });
      } catch (e) {
        console.log("Error scraping page text", e);
      }
    } else {
      console.log("TODO");
    }

    await page.close();

    return extractedText;
  }
}
