import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';

export default (specification) => {
  const {
    variationResolvers: assignments,
    content, // eslint-disable-line
    warehousing: warehousingEmbeddedSupply,
    ...productData
  } = specification;

  const { dimensions: supply, ...warehousing } = warehousingEmbeddedSupply || {};
  const tags = convertTagsToLowerCase(productData?.tags);
  const proxy = assignments ? { assignments } : undefined;

  return {
    ...productData,
    tags,
    warehousing,
    supply,
    proxy,
  };
};
