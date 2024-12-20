export const priceToString = ({ amount, currency }: { amount: number; currency: string }) => {
  const fixedPrice = amount / 100;
  return `${currency} ${fixedPrice}`;
};

export default priceToString;
