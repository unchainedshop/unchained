/* eslint-disable no-case-declarations */

import { RemoveUserQuotationService } from '@unchainedshop/types/quotations.js';

export const removeUserQuotationService: RemoveUserQuotationService = async (
  { userId },
  unchainedAPI,
) => {
  const { modules } = unchainedAPI;
  modules.quotations.removeQuotationByUserId(userId);
  return true;
};
