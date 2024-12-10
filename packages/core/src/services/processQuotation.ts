import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { Modules } from '../modules.js';
import { QuotationDirector } from '../core-index.js';

const findNextStatus = async (quotation: Quotation, unchainedAPI): Promise<QuotationStatus> => {
  let status = quotation.status as QuotationStatus;
  const director = await QuotationDirector.actions({ quotation }, unchainedAPI);

  if (status === QuotationStatus.REQUESTED) {
    if (!(await director.isManualRequestVerificationRequired())) {
      status = QuotationStatus.PROCESSING;
    }
  }
  if (status === QuotationStatus.PROCESSING) {
    if (!(await director.isManualProposalRequired())) {
      status = QuotationStatus.PROPOSED;
    }
  }
  return status;
};

export const processQuotationService = async (
  initialQuotation: Quotation,
  params: { quotationContext?: any },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;

  const quotationId = initialQuotation._id;
  let quotation = initialQuotation;
  let nextStatus = await findNextStatus(quotation, unchainedAPI);
  const director = await QuotationDirector.actions({ quotation }, unchainedAPI);

  if (quotation.status === QuotationStatus.REQUESTED && nextStatus !== QuotationStatus.REQUESTED) {
    await director.submitRequest(params.quotationContext);
  }

  quotation = await modules.quotations.findQuotation({ quotationId });
  nextStatus = await findNextStatus(quotation, unchainedAPI);
  if (nextStatus !== QuotationStatus.PROCESSING) {
    await director.verifyRequest(params.quotationContext);
  }

  quotation = await modules.quotations.findQuotation({ quotationId });
  nextStatus = await findNextStatus(quotation, unchainedAPI);
  if (nextStatus === QuotationStatus.REJECTED) {
    await director.rejectRequest(params.quotationContext);
  }

  quotation = await modules.quotations.findQuotation({ quotationId });
  nextStatus = await findNextStatus(quotation, unchainedAPI);
  if (nextStatus === QuotationStatus.PROPOSED) {
    const proposal = await director.quote();
    quotation = await modules.quotations.updateProposal(quotation._id, proposal);
    nextStatus = await findNextStatus(quotation, unchainedAPI);
  }

  const updatedQuotation = await unchainedAPI.modules.quotations.updateStatus(quotation._id, {
    status: nextStatus,
    info: 'quotation processed',
  });

  const user = await modules.users.findUserById(updatedQuotation.userId);
  const locale = modules.users.userLocale(user);

  await modules.worker.addWork({
    type: 'MESSAGE',
    retries: 0,
    input: {
      locale,
      template: 'QUOTATION_STATUS',
      quotationId: updatedQuotation._id,
    },
  });

  return updatedQuotation;
};
