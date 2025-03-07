import axios from "axios";
import { BlueSkyLinkPostingEngine } from "../BlueSkyLinkPostingEngine";
import { IContainer, IQueryEngine } from "@ts-flow/core";

jest.mock("axios");

describe("BlueSkyLinkPostingEngine", () => {
  const mockConfig = {
    identifier: "test-user.bsky.social",
    password: "test-password",
    apiUrl: "https://test.bsky.social/xrpc",
    text: "Test post ${value}",
    url: "https://example.com/${value}",
    utmCampaign: "test-campaign",
    outputEventName: "postCreated",
    outputProperty: "bskyResponse",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("successfully creates a post with OG data and image", async () => {
    // Mock auth token response
    const mockTokenResponse = {
      data: {
        accessJwt: "test-token",
        did: "did:test:123",
      },
    };

    // Mock OG data HTML response
    const mockHtmlResponse = {
      data: `
        <meta property="og:title" content="Test Title">
        <meta property="og:description" content="Test Description">
        <meta property="og:image" content="https://example.com/image.jpg">
      `,
    };

    // Mock image download response
    const mockImageResponse = {
      data: Buffer.from("fake-image"),
      headers: { "content-type": "image/jpeg" },
    };

    // Mock image upload response
    const mockBlobResponse = {
      data: {
        blob: {
          ref: { $link: "test-image-link" },
        },
      },
    };

    // Mock post creation response
    const mockPostResponse = {
      data: {
        uri: "at://did:test:123/app.bsky.feed.post/test",
        cid: "test-cid",
      },
    };

    // Setup axios mocks
    (axios.post as jest.Mock)
      .mockResolvedValueOnce(mockTokenResponse) // Auth token
      .mockResolvedValueOnce(mockBlobResponse) // Image upload
      .mockResolvedValueOnce(mockPostResponse); // Post creation
    (axios.get as jest.Mock)
      .mockResolvedValueOnce(mockHtmlResponse) // OG data
      .mockResolvedValueOnce(mockImageResponse); // Image download

    const engine: IQueryEngine = new BlueSkyLinkPostingEngine(
      "test-id",
      {} as IContainer,
      mockConfig,
    );

    const payload = { value: "test-value" };

    await engine.execute(payload, (eventName, result) => {
      expect(eventName).toBe("postCreated");
      expect(result.bskyResponse).toEqual(mockPostResponse.data);
    });

    // Verify post creation request
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenLastCalledWith(
      "https://test.bsky.social/xrpc/com.atproto.repo.createRecord",
      expect.objectContaining({
        collection: "app.bsky.feed.post",
        record: expect.objectContaining({
          text: "Test post test-value",
          facets: expect.arrayContaining([
            expect.objectContaining({
              features: [
                expect.objectContaining({
                  uri: expect.stringContaining("utm_campaign=test-campaign"),
                } as Record<string, unknown>),
              ],
            } as Record<string, unknown>),
          ]),
          embed: expect.objectContaining({
            external: expect.objectContaining({
              thumb: expect.objectContaining({
                ref: { $link: "test-image-link" },
              } as Record<string, unknown>),
            } as Record<string, unknown>),
          } as Record<string, unknown>),
        } as Record<string, unknown>),
      } as Record<string, unknown>),
      expect.any(Object),
    );
  });

  it("handles missing OG data gracefully", async () => {
    const mockTokenResponse = {
      data: {
        accessJwt: "test-token",
        did: "did:test:123",
      },
    };

    const mockHtmlResponse = {
      data: "<html><body>No OG data here</body></html>",
    };

    const mockPostResponse = {
      data: {
        uri: "at://did:test:123/app.bsky.feed.post/test",
        cid: "test-cid",
      },
    };

    (axios.post as jest.Mock)
      .mockResolvedValueOnce(mockTokenResponse)
      .mockResolvedValueOnce(mockPostResponse);
    (axios.get as jest.Mock).mockResolvedValueOnce(mockHtmlResponse);

    const engine: IQueryEngine = new BlueSkyLinkPostingEngine(
      "test-id",
      {} as IContainer,
      mockConfig,
    );

    const payload = { value: "test-value" };

    await engine.execute(payload, (eventName, result) => {
      expect(eventName).toBe("postCreated");
      expect(result.bskyResponse).toEqual(mockPostResponse.data);
    });

    // Verify post without OG data
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        record: expect.not.objectContaining({
          embed: expect.anything(),
        } as Record<string, unknown>),
      } as Record<string, unknown>),
      expect.any(Object),
    );
  });

  it("handles API errors appropriately", async () => {
    const mockError = {
      response: {
        data: {
          error: "InvalidRequest",
          message: "Test error",
        },
      },
    };

    (axios.post as jest.Mock).mockRejectedValue(mockError);

    const engine: IQueryEngine = new BlueSkyLinkPostingEngine(
      "test-id",
      {} as IContainer,
      mockConfig,
    );

    const payload = { value: "test-value" };

    await expect(engine.execute(payload, jest.fn())).rejects.toEqual(mockError);
  });

  it("processes template variables correctly", async () => {
    const mockTokenResponse = {
      data: {
        accessJwt: "test-token",
        did: "did:test:123",
      },
    };

    const mockPostResponse = {
      data: {
        uri: "test-uri",
        cid: "test-cid",
      },
    };

    (axios.post as jest.Mock)
      .mockResolvedValueOnce(mockTokenResponse)
      .mockResolvedValueOnce(mockPostResponse);
    (axios.get as jest.Mock).mockResolvedValue({ data: "" });

    const engine: IQueryEngine = new BlueSkyLinkPostingEngine(
      "test-id",
      {} as IContainer,
      mockConfig,
    );

    const payload = { value: "custom-value" };

    await engine.execute(payload, jest.fn());

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        record: expect.objectContaining({
          text: "Test post custom-value" as string,
        } as Record<string, unknown>),
      } as Record<string, unknown>),
      expect.any(Object),
    );
  });
});
