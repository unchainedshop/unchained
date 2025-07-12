import crypto from 'crypto';

const API_BASE_URL = 'https://checkout.postfinance.ch/api';

interface ApiConfig {
  spaceId: number;
  userId: number;
  apiSecret: string;
}

interface MacHeaders {
  'x-mac-version': string;
  'x-mac-userid': string;
  'x-mac-timestamp': string;
  'x-mac-value': string;
}

export class PostFinanceApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private generateMacHeaders(method: string, path: string): MacHeaders {
    const version = '1';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const userId = this.config.userId.toString();

    const dataToSign = [version, userId, timestamp, method, path].join('|');
    const macValue = crypto
      .createHmac('sha512', Buffer.from(this.config.apiSecret, 'base64'))
      .update(dataToSign, 'utf8')
      .digest('base64');

    return {
      'x-mac-version': version,
      'x-mac-userid': userId,
      'x-mac-timestamp': timestamp,
      'x-mac-value': macValue,
    };
  }

  async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const path = new URL(url).pathname;
    const macHeaders = this.generateMacHeaders(method, path);

    const headers: Record<string, string> = {
      ...macHeaders,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `PostFinance API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`,
      );
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>('PATCH', endpoint, body);
  }
}
