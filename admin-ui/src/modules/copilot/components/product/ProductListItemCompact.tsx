import React from 'react';
import ProductItemWrapperCompact from './ProductItemWrapperCompact';
import BundleItemCompact from './BundleItemCompact';
import VariationListItemCompact from './VariationListItemCompact';

const BundleProduct = ({ bundleItems }) => {
  if (!bundleItems?.length) return null;
  return bundleItems.map(({ product, quantity }, index) => (
    <BundleItemCompact
      key={`${index}-${product._id}`}
      product={product}
      quantity={quantity}
    />
  ));
};

const ConfigurableProduct = ({ variations }) => {
  if (!variations?.length) return null;
  return variations.map((variation, index) => (
    <VariationListItemCompact
      key={`${index}-${variation?._id}`}
      variation={variation}
    />
  ));
};

const ProductTypeMap = {
  BUNDLE_PRODUCT: BundleProduct,
  CONFIGURABLE_PRODUCT: ConfigurableProduct,
};

const EditTabMap = {
  BUNDLE_PRODUCT: 'bundle_products',
  CONFIGURABLE_PRODUCT: 'variations',
};

const ProductListItemCompact = ({ product, ...rest }) => {
  const Component = ProductTypeMap?.[product?.type];
  const tab = EditTabMap?.[product?.type];

  let renderedChildren = null;
  if (Component) {
    const output = Component({ ...product, ...rest });
    if (output && (Array.isArray(output) ? output.length > 0 : true)) {
      renderedChildren = output;
    }
  }

  return (
    <ProductItemWrapperCompact product={product} tab={tab}>
      {renderedChildren}
    </ProductItemWrapperCompact>
  );
};

export default ProductListItemCompact;
