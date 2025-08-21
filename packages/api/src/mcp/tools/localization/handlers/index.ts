import createLocalization from './createLocalization.js';
import updateLocalization from './updateLocalization.js';
import removeLocalization from './removeLocalization.js';
import getLocalization from './getLocalization.js';
import listLocalizations from './listLocalizations.js';
import countLocalizations from './countLocalizations.js';

export default {
  CREATE: createLocalization,
  UPDATE: updateLocalization,
  REMOVE: removeLocalization,
  GET: getLocalization,
  LIST: listLocalizations,
  COUNT: countLocalizations,
};
