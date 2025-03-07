import axios from "axios";

interface BlueskyToken {
  accessJwt: string;
  refreshJwt: string;
  handle: string;
  did: string;
}

export class BlueskyAuthManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private did: string | null = null;
  private readonly identifier: string;
  private readonly password: string;
  private readonly apiUrl: string;

  constructor(config: {
    identifier: string;
    password: string;
    apiUrl?: string;
  }) {
    this.identifier = config.identifier;
    this.password = config.password;
    this.apiUrl = config.apiUrl || "https://bsky.social/xrpc";
  }

  async getValidToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (this.refreshToken) {
      return this.refreshAccessToken();
    }

    return this.getNewToken();
  }

  async getDid(): Promise<string> {
    if (!this.did) {
      await this.getValidToken();
    }
    return this.did!;
  }

  private async getNewToken(): Promise<string> {
    const response = await axios.post<BlueskyToken>(
      `${this.apiUrl}/com.atproto.server.createSession`,
      {
        identifier: this.identifier,
        password: this.password,
      },
    );

    this.updateTokens(response.data);
    return this.accessToken!;
  }

  private async refreshAccessToken(): Promise<string> {
    try {
      const response = await axios.post<BlueskyToken>(
        `${this.apiUrl}/com.atproto.server.refreshSession`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.refreshToken}`,
          },
        },
      );

      this.updateTokens(response.data);
      return this.accessToken!;
    } catch (error) {
      console.error(
        "[BlueskyAuthManager] Error refreshing access token:",
        error,
      );
      return this.getNewToken();
    }
  }

  private updateTokens(tokenData: BlueskyToken): void {
    this.accessToken = tokenData.accessJwt;
    this.refreshToken = tokenData.refreshJwt;
    this.did = tokenData.did;
  }
}
