import { Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import { Modules } from '../modules.js';
import { QuotationDirector } from '../core-index.js';
import { addMessageService } from './addMessage.js';

const findNextStatus = async (quotation: Quotation, modules: Modules): Promise<QuotationStatus> => {
  let status = quotation.status as QuotationStatus;
  const director = await QuotationDirector.actions({ quotation }, { modules });

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

export async function processQuotationService(
  this: Modules,
  initialQuotation: Quotation,
  params: { quotationContext?: any },
) {
  const quotationId = initialQuotation._id;
  let quotation = initialQuotation;
  let nextStatus = await findNextStatus(quotation, this);
  const director = await QuotationDirector.actions({ quotation }, { modules: this });

  if (quotation.status === QuotationStatus.REQUESTED && nextStatus !== QuotationStatus.REQUESTED) {
    await director.submitRequest(params.quotationContext);
  }

  quotation = (await this.quotations.findQuotation({ quotationId })) as Quotation;
  nextStatus = await findNextStatus(quotation, this);
  if (nextStatus !== QuotationStatus.PROCESSING) {
    await director.verifyRequest(params.quotationContext);
  }

  quotation = (await this.quotations.findQuotation({ quotationId })) as Quotation;
  nextStatus = await findNextStatus(quotation, this);
  if (nextStatus === QuotationStatus.REJECTED) {
    await director.rejectRequest(params.quotationContext);
  }

  quotation = (await this.quotations.findQuotation({ quotationId })) as Quotation;
  nextStatus = await findNextStatus(quotation, this);
  if (nextStatus === QuotationStatus.PROPOSED) {
    const proposal = await director.quote();
    quotation = (await this.quotations.updateProposal(quotation._id, proposal)) as Quotation;
    nextStatus = await findNextStatus(quotation, this);
  }

  const updatedQuotation = (await this.quotations.updateStatus(quotation._id, {
    status: nextStatus,
    info: 'quotation processed',
  })) as Quotation;

  const user = await this.users.findUserById(updatedQuotation.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('QUOTATION_STATUS', {
    locale: locale.baseName,
    quotationId: updatedQuotation._id,
  });

  return updatedQuotation;
}
