import React from 'react';
import CopilotQuotationListItemCompact from './CopilotQuotationListItemCompact';

const CopilotQuotationList = ({ quotations }) => {
  if (!quotations || quotations.length === 0) return null;
  return (
    <div className="space-y-4">
      {quotations.map((quotation) => (
        <CopilotQuotationListItemCompact key={quotation._id} {...quotation} />
      ))}
    </div>
  );
};

export default CopilotQuotationList;
