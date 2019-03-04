import { createFilesCollection } from "meteor/unchained:core-files";

export const QuotationDocuments = createFilesCollection("quotation_documents", {
  maxSize: 10485760
});

export default QuotationDocuments;
