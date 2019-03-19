import React from 'react';

export default ({ money = { amount: 0, currency: 'CHF' } } = {}) => (
  <span>
    {money &&
      Intl.NumberFormat([], {
        style: 'currency',
        currency: money.currency
      }).format(money.amount / 100)}
  </span>
);
