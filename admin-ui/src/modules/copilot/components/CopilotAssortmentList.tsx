import React from 'react';
import AssortmentListItem from './AssortmentListItem';
import AssortmentListItemCompact from './AssortmentListItemCompact';
import ListViewWrapper from './ListViewWrapper';

interface AssortmentListProps {
  assortments: any[];
  className?: string;
  toolCallId?: string;
}

const CopilotAssortmentList: React.FC<AssortmentListProps> = ({
  assortments,
  className,
  toolCallId,
}) => {
  if (!assortments?.length) return null;
  return (
    <ListViewWrapper className={className}>
      {(viewMode) =>
        viewMode === 'grid' ? (
          <div
            className="gap-5"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gridTemplateRows: 'span 6',
            }}
          >
            {assortments?.map((assortment) => (
              <AssortmentListItem
                key={`${toolCallId}-${assortment._id}`}
                assortment={assortment}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {assortments.map((assortment) => (
              <AssortmentListItemCompact
                key={assortment._id}
                assortment={assortment}
              />
            ))}
          </div>
        )
      }
    </ListViewWrapper>
  );
};

export default CopilotAssortmentList;
