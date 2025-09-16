import React from 'react';

import ProductItemWrapperCompact from './ProductItemWrapperCompact';
import { IProduct } from '../../../../gql/types';
import BundleItemCompact from './BundleItemCompact';

type BundleProductCompactProps = {
  bundleItems: {
    product: any;
    quantity: number;
  }[];
  product: IProduct & any;
};

const BundleProductCompact: React.FC<BundleProductCompactProps> = ({
  bundleItems,
  product: bundleProduct,
}) => {
  return (
    <ProductItemWrapperCompact product={bundleProduct} tab="bundled_products">
      {(bundleItems || []).map(({ product, quantity }, index) => (
        <BundleItemCompact
          key={`${index}-${product._id}`}
          product={product}
          quantity={quantity}
        />
      ))}
    </ProductItemWrapperCompact>
  );
};

export default BundleProductCompact;
