import React from 'react';
import QuotationItemWrapperCompact from './CopilotQuotationItemWrapperCompact';
import ProductItemWrapperCompact from '../product/ProductItemWrapperCompact';

const CopilotQuotationListItemCompact = ({ ...quotation }) => {
  return (
    <QuotationItemWrapperCompact quotation={quotation}>
      <ProductItemWrapperCompact product={quotation.product} />
    </QuotationItemWrapperCompact>
  );
};

export default CopilotQuotationListItemCompact;
