import React from 'react';

import ProductItemWrapperCompact from './ProductItemWrapperCompact';
import { useIntl } from 'react-intl';
import { IProduct } from '../../../../gql/types';
import { useFormatPrice } from '../../../common/utils/utils';

type Price = {
  amount: number;
  currencyCode: string;
  isNetPrice: boolean;
  isTaxable: boolean;
};

type LeveledPrice = {
  minQuantity: number;
  maxQuantity: number | null;
  price: Price;
};

type PriceRange = {
  minPrice: Price;
  maxPrice: Price;
};

type Props = {
  product: IProduct & any;
  price?: Price;
  leveledCatalogPrice?: LeveledPrice[];
  priceRange?: PriceRange;
};

const CopilotPriceCompact: React.FC<Props> = ({
  product,
  price,
  leveledCatalogPrice = [],
  priceRange,
}) => {
  const { formatPrice } = useFormatPrice();
  const { formatMessage } = useIntl();

  const isSameRange =
    priceRange?.minPrice?.amount === priceRange?.maxPrice?.amount;

  const displayPriceRange = priceRange
    ? isSameRange
      ? formatPrice(priceRange.minPrice)
      : `${formatPrice(priceRange.minPrice)} – ${formatPrice(priceRange.maxPrice)}`
    : null;

  return (
    <ProductItemWrapperCompact product={product} tab="commerce">
      <div className="flex flex-col gap-3 text-sm text-center text-slate-700 dark:text-slate-300 min-w-[140px]">
        {price && (
          <>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatPrice(price)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {price.isNetPrice
                ? formatMessage({
                    id: 'net_price',
                    defaultMessage: 'Net Price',
                  })
                : formatMessage({ id: 'gross_price', defaultMessage: 'Gross' })}
              {' · '}
              {price.isTaxable
                ? formatMessage({ id: 'taxable', defaultMessage: 'Taxable' })
                : formatMessage({
                    id: 'non_taxable',
                    defaultMessage: 'Non-Taxable',
                  })}
            </span>
          </>
        )}

        {priceRange && (
          <div className="text-xs">
            <div className="text-slate-500 dark:text-slate-400">
              {formatMessage({
                id: 'price_range',
                defaultMessage: 'Price Range',
              })}
            </div>
            <div className="font-medium text-slate-900 dark:text-white">
              {displayPriceRange}
            </div>
          </div>
        )}

        {!!leveledCatalogPrice.length && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-left">
            <div className="font-medium mb-1 text-xs text-slate-600 uppercase">
              {formatMessage({
                id: 'tiered_pricing',
                defaultMessage: 'Tiered Pricing',
              })}
            </div>
            <ul className="space-y-1 text-xs">
              {leveledCatalogPrice.map(
                ({ minQuantity, maxQuantity, price }, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>
                      {minQuantity}
                      {maxQuantity !== null ? ` – ${maxQuantity}` : '+'}
                    </span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {formatPrice(price)}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </div>
    </ProductItemWrapperCompact>
  );
};

export default CopilotPriceCompact;
