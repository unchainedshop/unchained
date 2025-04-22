export const priceToString = ({ amount, currencyCode }: { amount: number; currencyCode: string }) => {
  const fixedPrice = amount / 100;
  return `${currencyCode} ${fixedPrice}`;
};

export default priceToString;
