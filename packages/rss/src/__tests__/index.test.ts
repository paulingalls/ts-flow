import axios from "axios";
import { RSSQueryEngine } from "../index";
import { IContainer, JSONObject } from "@ts-flow/core";

jest.mock("axios");
jest.mock("cheerio", () => ({
  load: jest.fn(() => jest.fn(() => ({
    attr: jest.fn(),
    text: jest.fn(),
  }))),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("RSSQueryEngine", () => {
  let rssEngine: RSSQueryEngine;
  let mockContainer: IContainer;
  let mockCompleteCallback: jest.Mock;

  const sampleRSSData = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Test RSS Feed</title>
        <item>
          <title>Test Article 1</title>
          <link>https://example.com/article1</link>
          <description>Test description 1</description>
          <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Test Article 2</title>
          <link>https://example.com/article2</link>
          <description>Test description 2</description>
          <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`;

  const sampleHTMLData = `
    <html>
      <head>
        <title>Test Article</title>
        <meta property="og:title" content="Open Graph Title" />
        <meta property="og:description" content="Open Graph Description" />
        <meta property="og:image" content="https://example.com/image.jpg" />
        <meta name="keywords" content="test,article,sample" />
      </head>
      <body>
        <h1>Test Article Content</h1>
      </body>
    </html>`;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContainer = {
      createInstance: jest.fn(),
      getInstance: jest.fn(),
      getInstances: jest.fn(),
      getNodeNames: jest.fn(),
    } as unknown as IContainer;

    mockCompleteCallback = jest.fn();
  });

  describe("Single URL RSS processing", () => {
    beforeEach(() => {
      const config: JSONObject = {
        urlTemplate: "https://example.com/rss?query=${query}",
        outputEventName: "rssProcessed",
        outputProperty: "rssData",
      };
      rssEngine = new RSSQueryEngine("test-rss", mockContainer, config);
    });

    it("should fetch and process RSS feed with metadata", async () => {
      // Mock axios responses
      mockedAxios.get
        .mockResolvedValueOnce({ data: sampleRSSData }) // RSS feed response
        .mockResolvedValueOnce({ data: sampleHTMLData }) // First article HTML
        .mockResolvedValueOnce({ data: sampleHTMLData }); // Second article HTML

      const payload = { query: "test" };

      await rssEngine.execute(payload, mockCompleteCallback);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.get).toHaveBeenNthCalledWith(1, "https://example.com/rss?query=test");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.get).toHaveBeenNthCalledWith(2, "https://example.com/article1");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.get).toHaveBeenNthCalledWith(3, "https://example.com/article2");

      expect(mockCompleteCallback).toHaveBeenCalledWith("rssProcessed", expect.objectContaining({
        query: "test",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        rssData: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          rss: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            channel: expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              item: expect.arrayContaining([
                expect.objectContaining({
                  title: "Test Article 1",
                  link: "https://example.com/article1",
                  description: "Test description 1",
                  pubDate: "2024-01-01T00:00:00.000Z",
                }),
                expect.objectContaining({
                  title: "Test Article 2",
                  link: "https://example.com/article2",
                  description: "Test description 2",
                  pubDate: "2024-01-02T00:00:00.000Z",
                }),
              ]),
            }),
          }),
        }),
      }));
    });

    it("should handle network errors gracefully", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

      const payload = { query: "test" };

      await expect(rssEngine.execute(payload, mockCompleteCallback)).rejects.toThrow("Network error");
      expect(mockCompleteCallback).not.toHaveBeenCalled();
    });

    it("should handle metadata extraction errors gracefully", async () => {
      // Mock RSS response but fail metadata fetching
      mockedAxios.get
        .mockResolvedValueOnce({ data: sampleRSSData })
        .mockRejectedValueOnce(new Error("Metadata fetch failed"))
        .mockRejectedValueOnce(new Error("Metadata fetch failed"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const payload = { query: "test" };

      await rssEngine.execute(payload, mockCompleteCallback);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching metadata for https://example.com/article1:",
        expect.any(Error)
      );
      expect(mockCompleteCallback).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Multiple URL RSS processing", () => {
    beforeEach(() => {
      const config: JSONObject = {
        dataRoot: "sources",
        urlParameter: "rssUrl",
        outputEventName: "rssProcessed",
        outputProperty: "aggregatedRss",
      };
      rssEngine = new RSSQueryEngine("test-rss-multi", mockContainer, config);
    });

    it("should process multiple RSS sources", async () => {
      const payload: JSONObject = {
        sources: [
          { id: "source1", account_id: "acc1", rssUrl: "https://source1.com/rss" },
          { id: "source2", account_id: "acc2", rssUrl: "https://source2.com/rss" },
        ],
      };

      // Mock RSS responses for both sources
      mockedAxios.get
        .mockResolvedValueOnce({ data: sampleRSSData })
        .mockResolvedValueOnce({ data: sampleHTMLData })
        .mockResolvedValueOnce({ data: sampleHTMLData })
        .mockResolvedValueOnce({ data: sampleRSSData })
        .mockResolvedValueOnce({ data: sampleHTMLData })
        .mockResolvedValueOnce({ data: sampleHTMLData });

      await rssEngine.execute(payload, mockCompleteCallback);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.get).toHaveBeenCalledTimes(6); // 2 RSS + 4 metadata requests
      expect(mockCompleteCallback).toHaveBeenCalledWith("rssProcessed", expect.objectContaining({
        sources: payload.sources,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        aggregatedRss: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          rss: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            channel: expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              item: expect.arrayContaining([
                expect.objectContaining({
                  accountId: "acc1",
                  dataSourceId: "source1",
                }),
                expect.objectContaining({
                  accountId: "acc1",
                  dataSourceId: "source1",
                }),
                expect.objectContaining({
                  accountId: "acc2",
                  dataSourceId: "source2",
                }),
                expect.objectContaining({
                  accountId: "acc2",
                  dataSourceId: "source2",
                }),
              ]),
            }),
          }),
        }),
      }));
    });

    it("should skip sources with missing URL parameter", async () => {
      const payload: JSONObject = {
        sources: [
          { id: "source1", account_id: "acc1", rssUrl: "https://source1.com/rss" },
          { id: "source2", account_id: "acc2" }, // Missing rssUrl
        ],
      };

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      mockedAxios.get
        .mockResolvedValueOnce({ data: sampleRSSData })
        .mockResolvedValueOnce({ data: sampleHTMLData })
        .mockResolvedValueOnce({ data: sampleHTMLData });

      await rssEngine.execute(payload, mockCompleteCallback);

      expect(consoleSpy).toHaveBeenCalledWith("Skipping source - missing URL parameter");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.get).toHaveBeenCalledTimes(3); // Only first source processed
      expect(mockCompleteCallback).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle empty sources array", async () => {
      const payload: JSONObject = { sources: [] };

      await expect(rssEngine.execute(payload, mockCompleteCallback)).rejects.toThrow("No RSS data was processed");
      expect(mockCompleteCallback).not.toHaveBeenCalled();
    });
  });

  describe("Output handling", () => {
    it("should merge data into payload when no outputProperty is specified", async () => {
      const config: JSONObject = {
        urlTemplate: "https://example.com/rss",
        outputEventName: "rssProcessed",
      };
      rssEngine = new RSSQueryEngine("test-rss-merge", mockContainer, config);

      mockedAxios.get
        .mockResolvedValueOnce({ data: sampleRSSData })
        .mockResolvedValueOnce({ data: sampleHTMLData })
        .mockResolvedValueOnce({ data: sampleHTMLData });

      const payload = { existingData: "test" };

      await rssEngine.execute(payload, mockCompleteCallback);

      expect(mockCompleteCallback).toHaveBeenCalledWith("rssProcessed", expect.objectContaining({
        existingData: "test",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        rss: expect.any(Object),
      }));
    });
  });

  describe("Date handling", () => {
    beforeEach(() => {
      const config: JSONObject = {
        urlTemplate: "https://example.com/rss",
        outputEventName: "rssProcessed",
      };
      rssEngine = new RSSQueryEngine("test-rss-dates", mockContainer, config);
    });

    it("should handle invalid publication dates", async () => {
      const invalidDateRSS = sampleRSSData.replace(
        "Mon, 01 Jan 2024 00:00:00 GMT",
        "Invalid Date String"
      );

      mockedAxios.get
        .mockResolvedValueOnce({ data: invalidDateRSS })
        .mockResolvedValueOnce({ data: sampleHTMLData })
        .mockResolvedValueOnce({ data: sampleHTMLData });

      await rssEngine.execute({}, mockCompleteCallback);

      expect(mockCompleteCallback).toHaveBeenCalledWith("rssProcessed", expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        rss: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          channel: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            item: expect.arrayContaining([
              expect.objectContaining({
                pubDate: "Invalid Date String", // Should preserve original if invalid
              }),
            ]),
          }),
        }),
      }));
    });
  });
});
