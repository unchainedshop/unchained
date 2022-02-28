import crypto from 'crypto';

const { UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET } = process.env;

const sign = (directoryName, hash, expiryTimestamp) => {
  if (!UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET)
    throw new Error(
      'To enable PUT based uploads you have to provide a random UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET environment variable',
    );
  const hmac = crypto.createHmac('sha256', UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET);
  const signature = [directoryName, hash, expiryTimestamp].join(':');
  hmac.update(signature);
  return hmac.digest('hex');
};

export default sign;
