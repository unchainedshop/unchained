import listQuotations from './listQuotations.ts';
import getQuotation from './getQuotation.ts';
import countQuotations from './countQuotations.ts';
import verifyQuotation from './verifyQuotation.ts';
import makeQuotationProposal from './makeQuotationProposal.ts';
import rejectQuotation from './rejectQuotation.ts';

export default {
  LIST: listQuotations,
  GET: getQuotation,
  COUNT: countQuotations,
  VERIFY: verifyQuotation,
  MAKE_PROPOSAL: makeQuotationProposal,
  REJECT: rejectQuotation,
};
