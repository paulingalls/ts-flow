import axios from "axios";

interface RedditToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export class RedditAuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;
  private scope: string = "submit";
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly userAgent: string;
  private readonly username: string;
  private readonly password: string;

  constructor(config: {
    clientId: string;
    clientSecret: string;
    userAgent: string;
    username: string;
    password: string;
  }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.userAgent = config.userAgent;
    this.username = config.username;
    this.password = config.password;
  }

  async getValidToken(): Promise<string> {
    // Check if current token is still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < this.expiresAt - 300000) {
      return this.accessToken;
    }

    // If we have a refresh token, use it
    if (this.refreshToken) {
      return this.refreshAccessToken();
    }

    // Otherwise get a new token
    return this.getNewToken();
  }

  private async getNewToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      "base64",
    );
    const data = new URLSearchParams();
    data.append("grant_type", "password");
    data.append("username", this.username);
    data.append("password", this.password);
    data.append("scope", this.scope);

    const response = await axios.post<RedditToken>(
      "https://www.reddit.com/api/v1/access_token",
      data,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "User-Agent": this.userAgent,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    this.updateTokens(response.data);
    return this.accessToken!;
  }

  private async refreshAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      "base64",
    );

    try {
      const response = await axios.post<RedditToken>(
        "https://www.reddit.com/api/v1/access_token",
        `grant_type=refresh_token&refresh_token=${this.refreshToken}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "User-Agent": this.userAgent,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      this.updateTokens(response.data);
      return this.accessToken!;
    } catch (error) {
      // If refresh fails, try getting a new token
      console.error(
        "[RedditAuthManager] Error refreshing access token:",
        error,
      );
      return this.getNewToken();
    }
  }

  private updateTokens(tokenData: RedditToken): void {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.expiresAt = Date.now() + tokenData.expires_in * 1000;
  }
}
