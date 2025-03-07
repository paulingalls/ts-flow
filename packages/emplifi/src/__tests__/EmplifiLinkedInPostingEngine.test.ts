import axios from "axios";
import { EmplifiLinkedInPostingEngine } from "../EmplifiLinkedInPostingEngine";
import { IContainer, IQueryEngine } from "@ts-flow/core";

jest.mock("axios");

describe("EmplifiLinkedInPostingEngine", () => {
  const mockConfig = {
    apiKey: "test-api-key",
    apiSecret: "test-api-secret",
    baseUrl: "https://test.socialbakers.com/",
    profileId: "12345",
    text: "Test post ${value}",
    url: "https://example.com/${value}",
    utmCampaign: "test-campaign",
    outputEventName: "postCreated",
    outputProperty: "linkedinResponse",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("successfully creates a LinkedIn draft post", async () => {
    // Mock auth token response
    const mockTokenResponse = {
      data: {
        access_token: "test-token",
        expires_in: 3600,
        token_type: "Bearer",
      },
    };

    // Mock post creation response
    const mockPostResponse = {
      data: {
        id: "post123",
        status: "draft",
      },
    };

    // Setup axios mocks
    (axios.post as jest.Mock)
      .mockResolvedValueOnce(mockTokenResponse) // Auth token request
      .mockResolvedValueOnce(mockPostResponse); // Post creation

    const engine: IQueryEngine = new EmplifiLinkedInPostingEngine(
      "test-id",
      {} as IContainer,
      mockConfig,
    );

    const payload = { value: "test-value" };

    await engine.execute(payload, (eventName, result) => {
      expect(eventName).toBe("postCreated");
      expect(result.linkedinResponse).toEqual(mockPostResponse.data);
    });

    // Verify auth request
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenCalledWith(
      "https://test.socialbakers.com/oauth/access_token",
      {
        grant_type: "client_credentials",
        client_id: "test-api-key",
        client_secret: "test-api-secret",
      },
      expect.any(Object),
    );

    // Verify post creation request
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenLastCalledWith(
      "https://test.socialbakers.com/api/v1/profiles/12345/linkedin/posts",
      {
        profile_id: "12345",
        comment: "Test post test-value",
        content_url: expect.stringContaining(
          "utm_campaign=test-campaign",
        ) as string,
        published: false,
      },
      expect.objectContaining({
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      }),
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

    const engine: IQueryEngine = new EmplifiLinkedInPostingEngine(
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
        access_token: "test-token",
        expires_in: 3600,
        token_type: "Bearer",
      },
    };

    const mockPostResponse = {
      data: {
        id: "post123",
        status: "draft",
      },
    };

    (axios.post as jest.Mock)
      .mockResolvedValueOnce(mockTokenResponse)
      .mockResolvedValueOnce(mockPostResponse);

    const engine: IQueryEngine = new EmplifiLinkedInPostingEngine(
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
        comment: "Test post custom-value",
        content_url: expect.stringContaining("custom-value"),
      } as Record<string, unknown>),
      expect.any(Object),
    );
  });
});
