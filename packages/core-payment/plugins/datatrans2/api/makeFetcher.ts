export default (
  endpoint: string,
  merchantId: string,
  secret: string
): ((path: string, body: unknown) => Promise<Response>) => {
  const token = `${merchantId}:${secret}`;

  return (path: string, body: unknown): Promise<Response> =>
    fetch(`${endpoint}${path}`, {
      method: body ? 'POST' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(token, 'utf-8').toString(
          'base64'
        )}`,
      },
    });
};
