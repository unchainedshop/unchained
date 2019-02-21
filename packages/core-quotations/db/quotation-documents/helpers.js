import 'meteor/dburles:collection-helpers';
import { log } from 'meteor/unchained:core-logger';
import { DocumentDirector } from 'meteor/unchained:core-documents';
import { QuotationDocuments } from './collections';
import { QuotationDocumentTypes } from './schema';
import { Quotations } from '../quotations/collections';

class QuotationDocumentDirector extends DocumentDirector {
  constructor(context) {
    const documents = context && context.quotation && context.quotation.documents();
    super({ documents, ...context });
  }

  resolveQuotationNumber(options) {
    const quotationNumber = (options && options.quotationNumber)
      || this.context.quotation.quotationNumber;
    log(`DocumentDirector -> QuotationNumber resolved: ${quotationNumber}`);
    return quotationNumber;
  }

  buildProposal(options) {
    const quotationNumber = this.resolveQuotationNumber(options);
    if (!quotationNumber) return;
    this.execute('buildProposal', { quotationNumber, ...options }).forEach((doc) => {
      if (doc) {
        const { date } = options;
        const { file, meta, ...rest } = doc;
        this.context.quotation.addDocument(file, {
          date,
          type: QuotationDocumentTypes.PROPOSAL,
          ...meta,
        }, rest);
      }
    });
  }

  updateDocuments({ date, status, ...overrideValues }) {
    if (!this.context.quotation || !date) return;
    const { quotation } = this.context;
    quotation.status = status;

    if (!this.isDocumentExists({
      type: QuotationDocumentTypes.PROPOSAL,
    })) {
      this.buildProposal({
        date,
        status,
        ancestors: this.filteredDocuments(),
        ...overrideValues,
      });
    }
  }
}


QuotationDocuments.updateDocuments = ({ quotationId, ...rest }) => {
  const quotation = Quotations.findOne({ _id: quotationId });
  const director = new QuotationDocumentDirector({ quotation });
  log('Update Quotation Documents', { quotationId });
  director.updateDocuments({ ...rest });
};
