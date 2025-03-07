import axios from "axios";
import { RedditLinkPostingEngine } from "../index";
import { IContainer, IQueryEngine } from "@ts-flow/core";

jest.mock("axios");

describe("RedditPostQueryEngine", () => {
  const mockConfig = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    appName: "test-user-app",
    username: "test-user",
    password: "test-password",
    subreddit: "test-subreddit",
    title: "Test Title ${value}",
    url: "https://example.com/${value}",
    utmCampaign: "test-utm-campaign",
    outputEventName: "postCreated",
    outputProperty: "redditResponse",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("successfully creates a Reddit post", async () => {
    const mockTokenResponse = {
      data: {
        access_token: "test-token",
        expires_in: 3600,
        token_type: "bearer"
      }
    };

    const mockPostResponse = {
      data: {
        json: {
          data: {
            url: "https://reddit.com/r/test/comments/123/test",
            id: "123"
          }
        }
      }
    };

    (axios.post as jest.Mock)
      .mockResolvedValueOnce(mockTokenResponse)  // First call for token
      .mockResolvedValueOnce(mockPostResponse);  // Second call for post

    const queryEngine: IQueryEngine = new RedditLinkPostingEngine(
      "test-id",
      {} as IContainer,
      mockConfig
    );

    const payload = { value: "test-value" };

    await queryEngine.execute(payload, (eventName, result) => {
      expect(eventName).toBe("postCreated");
      expect(result.redditResponse).toEqual(mockPostResponse.data);
    });

    // Verify token request
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(axios.post).toHaveBeenCalledWith(
      "https://www.reddit.com/api/v1/access_token",
      expect.any(URLSearchParams),
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Basic') as string,
          'Content-Type': 'application/x-www-form-urlencoded' as string
        })
      })
    );
  });

  it("handles API errors appropriately", async () => {
    const mockError = {
      response: {
        data: {
          error: "invalid_grant",
          error_description: "Invalid credentials"
        }
      }
    };

    (axios.post as jest.Mock).mockRejectedValue(mockError);

    const queryEngine: IQueryEngine = new RedditLinkPostingEngine(
      "test-id",
      {} as IContainer,
      mockConfig
    );

    const payload = { value: "test-value" };

    await expect(queryEngine.execute(payload, jest.fn())).rejects.toEqual(mockError);
  });
});