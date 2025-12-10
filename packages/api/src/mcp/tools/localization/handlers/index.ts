import createLocalization from './createLocalization.ts';
import updateLocalization from './updateLocalization.ts';
import removeLocalization from './removeLocalization.ts';
import getLocalization from './getLocalization.ts';
import listLocalizations from './listLocalizations.ts';
import countLocalizations from './countLocalizations.ts';

export default {
  CREATE: createLocalization,
  UPDATE: updateLocalization,
  REMOVE: removeLocalization,
  GET: getLocalization,
  LIST: listLocalizations,
  COUNT: countLocalizations,
};
