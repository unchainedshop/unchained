const roundedAmountFromOrder = (order: any): { currency: string; amount: number } => {
  const { currency, amount } = order.pricing().total();
  return {
    currency,
    amount: Math.round(amount),
  };
};

export default roundedAmountFromOrder;
