import crypto from 'crypto';

export default (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};
