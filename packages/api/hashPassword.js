import crypto from 'crypto';

export default function(password) {
  return {
    digest: crypto
      .createHash('sha256')
      .update(password)
      .digest('hex'),
    algorithm: 'sha-256'
  };
}
