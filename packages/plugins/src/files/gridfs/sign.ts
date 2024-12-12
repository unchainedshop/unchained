const { UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET } = process.env;

const sign = async (directoryName, hash, expiryTimestamp) => {
  if (!UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET)
    throw new Error(
      'To enable PUT based uploads you have to provide a random UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET environment variable',
    );

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode([directoryName, hash, expiryTimestamp].join(':')),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

export default sign;
