'use client';

import React from 'react';
import CopilotOrderItemWrapper from './CopilotOrderItemWrapper';
import { ProductListItemCompact } from '../product';

export const CopilotOrderListItem = ({ order, toolCallId = null }) => {
  if (!order) return null;
  const items = (order?.items || [])?.map((product) => (
    <ProductListItemCompact
      key={`${product?._id}-${order?._id}-${toolCallId}`}
      product={product}
    />
  ));
  return (
    <CopilotOrderItemWrapper order={order}>
      {items?.length ? items : null}
    </CopilotOrderItemWrapper>
  );
};

const CopilotOrderList = ({ orders, toolCallId }) => {
  if (!orders?.length) return null;
  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <CopilotOrderListItem
          order={order}
          key={`${order._id}-${toolCallId}`}
          toolCallId={toolCallId}
        />
      ))}
    </div>
  );
};

export default CopilotOrderList;
