// import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
//
// checkNpmVersions({
//   faker: '4.x',
// }, 'base');

import Address from './address-schema';
import Contact from './contact-schema';
import * as schemaFields from './common-schema-fields';

export fakeTimestampFields from './fake-timestamp-fields';

export fakeAddress from './fake-address';
export objectInvert from './object-invert';
export findPreservingIds from './find-preserving-ids';
export slugify from './slugify';

const Schemas = {
  ...schemaFields,
  Address,
  Contact
};

export { Schemas };
