import crypto from 'crypto';

export default function hashPassword(password) {
  return {
    digest: crypto.createHash('sha256').update(password).digest('hex'),
    algorithm: 'sha-256',
  };
}
