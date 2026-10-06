import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import verifyQuotation from './verifyQuotation.ts';
import rejectQuotation from './rejectQuotation.ts';
import makeQuotationProposal from './makeQuotationProposal.ts';

// The quotation services take { quotationContext }, which they hand to the adapter hooks
const buildContext = (status: string) => {
  const quotation = { _id: 'quotation-1', status, userId: 'user-1', productId: 'product-1' };
  const service = mock.fn(async () => quotation);
  const load = async () => null;
  return {
    service,
    context: {
      modules: {
        quotations: { findQuotation: async () => quotation, normalizedStatus: () => status },
      },
      services: {
        quotations: {
          verifyQuotation: service,
          rejectQuotation: service,
          proposeQuotation: service,
        },
      },
      loaders: {
        userLoader: { load },
        productLoader: { load },
        productTextLoader: { load },
        countryLoader: { load },
        currencyLoader: { load },
      },
    } as any,
  };
};

describe('MCP quotation handlers pass the quotation context', () => {
  const quotationContext = { reason: 'checked by phone' };

  it('VERIFY', async () => {
    const { context, service } = buildContext('REQUESTED');
    await verifyQuotation(context, { quotationId: 'quotation-1', quotationContext } as any);
    assert.deepEqual(service.mock.calls[0].arguments[1], { quotationContext });
  });

  it('REJECT', async () => {
    const { context, service } = buildContext('PROPOSED');
    await rejectQuotation(context, { quotationId: 'quotation-1', quotationContext } as any);
    assert.deepEqual(service.mock.calls[0].arguments[1], { quotationContext });
  });

  it('MAKE_PROPOSAL', async () => {
    const { context, service } = buildContext('PROCESSING');
    await makeQuotationProposal(context, { quotationId: 'quotation-1', quotationContext } as any);
    assert.deepEqual(service.mock.calls[0].arguments[1], { quotationContext });
  });
});
