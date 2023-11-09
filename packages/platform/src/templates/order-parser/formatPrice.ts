export const formatPrice = ({ amount, currency }: { amount: number; currency: string }) => {
  const fixedPrice = amount / 100;
  return `${currency} ${fixedPrice}`;
};

export default formatPrice;
