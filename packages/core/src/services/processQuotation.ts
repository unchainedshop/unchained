import { type Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import type { Modules } from '../modules.ts';
import { QuotationDirector } from '../core-index.ts';
import { addMessageService } from './addMessage.ts';

const findNextStatus = async (
  director: Awaited<ReturnType<typeof QuotationDirector.actions>>,
  quotation: Quotation,
): Promise<QuotationStatus> => {
  let status = quotation.status as QuotationStatus;

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

  // The document is threaded through (like processOrder does with orders);
  // a re-fetch only happens after an adapter hook actually ran, because hooks
  // are the only channel through which adapters mutate the quotation.
  let quotation = initialQuotation;
  const director = await QuotationDirector.actions({ quotation }, { modules: this });

  const runHook = async (hook: (quotationContext?: any) => Promise<boolean>) => {
    await hook(params.quotationContext);
    quotation = (await this.quotations.findQuotation({ quotationId })) as Quotation;
    return findNextStatus(director, quotation);
  };

  let nextStatus = await findNextStatus(director, quotation);

  if (quotation.status === QuotationStatus.REQUESTED && nextStatus !== QuotationStatus.REQUESTED) {
    nextStatus = await runHook(director.submitRequest);
  }
  if (nextStatus !== QuotationStatus.PROCESSING) {
    nextStatus = await runHook(director.verifyRequest);
  }
  if (nextStatus === QuotationStatus.REJECTED) {
    nextStatus = await runHook(director.rejectRequest);
  }
  if (nextStatus === QuotationStatus.PROPOSED) {
    const proposal = await director.quote();
    quotation = (await this.quotations.updateProposal(quotation._id, proposal)) as Quotation;
    nextStatus = await findNextStatus(director, quotation);
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
