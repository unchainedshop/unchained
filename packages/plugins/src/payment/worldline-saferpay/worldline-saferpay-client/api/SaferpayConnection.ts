/// <reference lib="dom" />
export class SaferpayConnection {
  private baseUrl: string;

  private user: string;

  private password: string;

  public constructor(baseUrl: string, user: string, password: string) {
    this.baseUrl = baseUrl;
    this.user = user;
    this.password = password;
  }

  private buildUrl(uri: string): string {
    return this.baseUrl + uri;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${this.user}:${this.password}`, 'binary').toString(
        'base64',
      )}`,
    };
  }

  public async post(uri: string, data: object): Promise<any> {
    const res = await fetch(this.buildUrl(uri), {
      method: 'POST',
      body: JSON.stringify(data),
      // eslint-disable-next-line
      // @ts-ignore
      duplex: 'half',
      headers: this.getHeaders(),
    });
    return res.json();
  }
}
