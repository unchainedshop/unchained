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
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
      Authorization: `Basic ${btoa(`${this.user}:${this.password}`)}`,
    };
  }

  public async post(uri: string, data: object): Promise<any> {
    const res = await fetch(this.buildUrl(uri), {
      method: 'POST',
      body: JSON.stringify(data),
      headers: this.getHeaders(),
    });
    return res.json();
  }
}
