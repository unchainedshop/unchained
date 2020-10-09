import { Accounts } from 'meteor/accounts-base';
import crypto from 'crypto';

const METEOR_ID_LENGTH = 17;

export const idProvider = () =>
  crypto
    .randomBytes(30)
    .toString('base64')
    .replace(/[\W_]+/g, '')
    .substr(0, METEOR_ID_LENGTH);

export default function getConnection() {
  const connectionId = idProvider();
  return {
    id: connectionId,
    close() {
      Accounts._removeTokenFromConnection(connectionId); // eslint-disable-line
      delete Accounts._accountData[connectionId]; // eslint-disable-line
    },
  };
}
