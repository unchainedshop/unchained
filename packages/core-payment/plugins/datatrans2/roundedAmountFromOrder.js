const roundedAmountFromOrder = (order) => {
  const { currency, amount } = order.pricing().total();
  return {
    currency,
    amount: Math.round(amount),
  };
};

export default roundedAmountFromOrder;
