import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { InvalidIdError } from '../../errors';

export const mapQuotation = (modules) => (quotation) => ({
  ...quotation,
  logs: async ({ limit, offset }) => {
    return await modules.logger.findLogs(
      { 'meta.quotation': quotation._id },
      {
        skip: offset,
        limit,
        sort: {
          created: -1,
        },
      }
    );
  },
});

export default function quotation(root, { quotationId }, { modules, userId }) {
  log(`query quotation ${quotationId}`, { userId, quotationId });

  if (!quotationId) throw new InvalidIdError({ quotationId });
  const quotation = Quotations.findQuotation({ quotationId });
  return mapQuotation(modules)(quotation);
}
