// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
//
// checkNpmVersions({
//   faker: '4.x',
// }, 'base');

import Address from './address-schema';
import Contact from './contact-schema';
import * as schemaFields from './common-schema-fields';

export fakeTimestampFields from './fake-timestamp-fields';
export fileStoragePath from './file-storage-path';
export fakeAddress from './fake-address';
export objectInvert from './object-invert';

const Schemas = {
  ...schemaFields,
  Address,
  Contact,
};

export { Schemas };
