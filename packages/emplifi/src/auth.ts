import axios from "axios";

interface EmplifiToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class EmplifiAuthManager {
  private accessToken: string | null = null;
  private expiresAt: number = 0;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;

  constructor(config: { apiKey: string; apiSecret: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || "https://api.socialbakers.com/";
  }

  async getValidToken(): Promise<string> {
    // Check if current token is still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < this.expiresAt - 300000) {
      return this.accessToken;
    }

    // Get new token
    return this.getNewToken();
  }

  private async getNewToken(): Promise<string> {
    try {
      const response = await axios.post<EmplifiToken>(
        `${this.baseUrl}oauth/access_token`,
        {
          grant_type: "client_credentials",
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      this.updateToken(response.data);
      return this.accessToken!;
    } catch (error) {
      console.error("[EmplifiAuthManager] Error getting access token:", error);
      throw error;
    }
  }

  private updateToken(tokenData: EmplifiToken): void {
    this.accessToken = tokenData.access_token;
    this.expiresAt = Date.now() + tokenData.expires_in * 1000;
  }
}
