export default (specification) => {
  const {
    variationResolvers: assignments,
    content,
    warehousing: warehousingEmbeddedSupply,
    ...productData
  } = specification;

  const { dimensions: supply, ...warehousing } =
    warehousingEmbeddedSupply || {};

  const proxy = assignments ? { assignments } : undefined;

  return {
    ...productData,
    warehousing,
    supply,
    proxy,
  };
};
