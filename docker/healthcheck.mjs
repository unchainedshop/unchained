const endpoint = new URL(
  process.env.GRAPHQL_API_PATH || '/graphql',
  `http://127.0.0.1:${process.env.PORT || 3000}`,
);

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '{ shopInfo { _id } }' }),
    signal: AbortSignal.timeout(2000),
  });
  const result = await response.json();
  if (!response.ok || result.errors?.length || !result.data?.shopInfo?._id) {
    process.exitCode = 1;
  }
} catch {
  process.exitCode = 1;
}
