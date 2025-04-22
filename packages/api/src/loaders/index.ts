import { UnchainedCore } from '@unchainedshop/core';
import assortmentLoader from './assortmentLoader.js';
import assortmentTextLoader from './assortmentTextLoader.js';
import assortmentMediaTextLoader from './assortmentMediaTextLoader.js';
import assortmentMediasLoader from './assortmentMediasLoader.js';
import assortmentLinkLoader from './assortmentLinkLoader.js';
import assortmentLinksLoader from './assortmentLinksLoader.js';
import assortmentProductLoader from './assortmentProductLoader.js';
import assortmentProductsLoader from './assortmentProductsLoader.js';
import filterLoader from './filterLoader.js';
import filterTextLoader from './filterTextLoader.js';
import productLoader from './productLoader.js';
import productLoaderBySKU from './productLoaderBySKU.js';
import productTextLoader from './productTextLoader.js';
import productMediaTextLoader from './productMediaTextLoader.js';
import productMediasLoader from './productMediasLoader.js';
import fileLoader from './fileLoader.js';
import userLoader from './userLoader.js';

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
    productLoaderBySKU: productLoaderBySKU(unchainedAPI),
    productTextLoader: productTextLoader(unchainedAPI),
    productMediaTextLoader: productMediaTextLoader(unchainedAPI),
    productMediasLoader: productMediasLoader(unchainedAPI),

    fileLoader: fileLoader(unchainedAPI),

    userLoader: userLoader(unchainedAPI),
  };
};

export type UnchainedLoaders = Awaited<ReturnType<typeof loaders>>;

export default loaders;
