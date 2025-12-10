import type { UnchainedCore } from '@unchainedshop/core';
import assortmentLoader from './assortmentLoader.ts';
import assortmentTextLoader from './assortmentTextLoader.ts';
import assortmentMediaTextLoader from './assortmentMediaTextLoader.ts';
import assortmentMediasLoader from './assortmentMediasLoader.ts';
import assortmentLinkLoader from './assortmentLinkLoader.ts';
import assortmentLinksLoader from './assortmentLinksLoader.ts';
import assortmentProductLoader from './assortmentProductLoader.ts';
import assortmentProductsLoader from './assortmentProductsLoader.ts';
import filterLoader from './filterLoader.ts';
import filterTextLoader from './filterTextLoader.ts';
import productLoader from './productLoader.ts';
import productBySKULoader from './productBySKULoader.ts';
import productTextLoader from './productTextLoader.ts';
import productMediaTextLoader from './productMediaTextLoader.ts';
import productMediasLoader from './productMediasLoader.ts';
import productProxiesLoader from './productProxiesLoader.ts';
import productVariationLoader from './productVariationLoader.ts';
import productVariationByKeyLoader from './productVariationByKeyLoader.ts';
import productVariationTextLoader from './productVariationTextLoader.ts';
import fileLoader from './fileLoader.ts';
import userLoader from './userLoader.ts';
import countryLoader from './countryLoader.ts';
import currencyLoader from './currencyLoader.ts';
import languageLoader from './languageLoader.ts';
import deliveryProviderLoader from './deliveryProviderLoader.ts';
import paymentProviderLoader from './paymentProviderLoader.ts';
import warehousingProviderLoader from './warehousingProviderLoader.ts';
import orderLoader from './orderLoader.ts';
import quotationLoader from './quotationLoader.ts';

const loaders = (unchainedAPI: UnchainedCore) => {
  return {
    assortmentLoader: assortmentLoader(unchainedAPI),
    assortmentTextLoader: assortmentTextLoader(unchainedAPI),
    assortmentMediaTextLoader: assortmentMediaTextLoader(unchainedAPI),
    assortmentMediasLoader: assortmentMediasLoader(unchainedAPI),
    assortmentLinkLoader: assortmentLinkLoader(unchainedAPI),
    assortmentLinksLoader: assortmentLinksLoader(unchainedAPI),
    assortmentProductLoader: assortmentProductLoader(unchainedAPI),
    assortmentProductsLoader: assortmentProductsLoader(unchainedAPI),

    filterLoader: filterLoader(unchainedAPI),
    filterTextLoader: filterTextLoader(unchainedAPI),

    productLoader: productLoader(unchainedAPI),
    productBySKULoader: productBySKULoader(unchainedAPI),
    productTextLoader: productTextLoader(unchainedAPI),
    productMediaTextLoader: productMediaTextLoader(unchainedAPI),
    productMediasLoader: productMediasLoader(unchainedAPI),
    productProxiesLoader: productProxiesLoader(unchainedAPI),
    productVariationLoader: productVariationLoader(unchainedAPI),
    productVariationByKeyLoader: productVariationByKeyLoader(unchainedAPI),
    productVariationTextLoader: productVariationTextLoader(unchainedAPI),

    fileLoader: fileLoader(unchainedAPI),

    userLoader: userLoader(unchainedAPI),

    countryLoader: countryLoader(unchainedAPI),

    currencyLoader: currencyLoader(unchainedAPI),

    languageLoader: languageLoader(unchainedAPI),

    deliveryProviderLoader: deliveryProviderLoader(unchainedAPI),

    paymentProviderLoader: paymentProviderLoader(unchainedAPI),

    warehousingProviderLoader: warehousingProviderLoader(unchainedAPI),

    orderLoader: orderLoader(unchainedAPI),

    quotationLoader: quotationLoader(unchainedAPI),
  };
};

export type UnchainedLoaders = Awaited<ReturnType<typeof loaders>>;

export default loaders;
