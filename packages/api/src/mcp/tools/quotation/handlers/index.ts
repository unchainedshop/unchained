import listQuotations from './listQuotations.js';
import getQuotation from './getQuotation.js';
import countQuotations from './countQuotations.js';
import verifyQuotation from './verifyQuotation.js';
import makeQuotationProposal from './makeQuotationProposal.js';
import rejectQuotation from './rejectQuotation.js';

export default {
  LIST: listQuotations,
  GET: getQuotation,
  COUNT: countQuotations,
  VERIFY: verifyQuotation,
  MAKE_PROPOSAL: makeQuotationProposal,
  REJECT: rejectQuotation,
};
