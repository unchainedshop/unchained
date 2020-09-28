import React from 'react';

const FormattedMoney = ({ money = { amount: 0, currency: 'CHF' } } = {}) => (
  <span>
    {money &&
      Intl.NumberFormat([], {
        style: 'currency',
        currency: money.currency,
      }).format(money.amount / 100)}
  </span>
);

export default FormattedMoney;
