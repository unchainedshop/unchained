import crypto from 'crypto'

export default (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};
