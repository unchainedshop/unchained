import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';

export default function () {
  const connectionId = Random.id();
  return {
    id: connectionId,
    close() {
      Accounts._removeTokenFromConnection(connectionId); // eslint-disable-line
      delete Accounts._accountData[connectionId];  // eslint-disable-line
    },
  };
}
