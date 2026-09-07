import {
  type UnchainedCore,
  type IWarehousingAdapter,
  type WarehousingContext,
  WarehousingError,
  WarehousingAdapter,
} from '@unchainedshop/core';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { ProductContractStandard, ProductType } from '@unchainedshop/core-products';
import { systemLocale } from '@unchainedshop/utils';
import { generateDbObjectId } from '@unchainedshop/mongodb';
import { getFileAdapter } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:eth-minter');

const buildTokenMetadata = async ({
  product,
  token,
  tokenSerialNumber,
  modules,
  locale,
  ercMetadataProperties,
  tokenId,
}: {
  product: any;
  token: any;
  tokenSerialNumber: string;
  modules: any;
  locale: any;
  ercMetadataProperties: any;
  tokenId?: string;
}) => {
  const { ROOT_URL = 'http://localhost:4010' } = process.env;

  const allLanguages = await modules.languages.findLanguages({
    includeInactive: false,
  });

  const [firstMedia] = await modules.products.media.findProductMedias({
    productId: product._id,
    limit: 1,
  });
  const file = firstMedia && (await modules.files.findFile({ fileId: firstMedia.mediaId }));

  const fileAdapter = file && getFileAdapter();
  const signedUrl = await fileAdapter?.createDownloadURL(file!);
  const url = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));
  const text = await modules.products.texts.findLocalizedText({
    productId: product._id,
    locale: locale || systemLocale,
  });

  const name = `${text.title} #${tokenSerialNumber}`;

  const isDefaultLanguageActive = locale ? locale.language === systemLocale.language : true;
  const localization = isDefaultLanguageActive
    ? {
        uri: `${ROOT_URL}/erc-metadata/${product._id}/{locale}/${tokenId}.json`,
        default: systemLocale.language,
        locales: allLanguages.map((lang) => lang.isoCode),
      }
    : undefined;

  return {
    name,
    description: text.description,
    image: url,
    properties: ercMetadataProperties,
    localization,
    ...(token?.meta || {}),
  };
};

export const ETHMinter: IWarehousingAdapter = {
  ...WarehousingAdapter,

  key: 'shop.unchained.warehousing.infinite-minter',
  version: '1.0',
  label: 'Infinite Minter',
  orderIndex: 0,

  initialConfiguration: [{ key: 'chainId', value: '0' }],

  typeSupported: (type) => {
    return type === WarehousingProviderType.VIRTUAL;
  },

  actions: (configuration, context) => {
    const { MINTER_TOKEN_OFFSET = '0' } = process.env;

    const { product, orderPosition, token, modules, locale } = context as WarehousingContext &
      UnchainedCore;
    const { contractAddress, contractStandard, tokenId, supply, ercMetadataProperties } =
      product?.tokenization || {};

    const getTokensCreated = async ({ skipCancelled = false } = {}) => {
      const selector: Record<string, any> =
        contractStandard === ProductContractStandard.ERC721
          ? { productId: product!._id }
          : {
              productId: product!._id,
              tokenSerialNumber: tokenId,
            };

      if (skipCancelled) {
        selector['meta.cancelled'] = { $ne: true };
      }

      const existingTokens = await modules.warehousing.findTokens(selector);
      const tokensCreated = existingTokens.reduce((acc, curToken) => {
        return acc + curToken.quantity;
      }, 0);
      return tokensCreated;
    };

    return {
      ...WarehousingAdapter.actions(configuration, context),

      isActive() {
        return product?.type === ProductType.TOKENIZED_PRODUCT;
      },

      configurationError() {
        if (contractStandard === 'ERC1155' && !tokenId) {
          logger.error(
            `Token ID is required for ERC1155 contract standard (productId: ${product!._id})`,
          );
          return WarehousingError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      stock: async () => {
        const tokensCreated = await getTokensCreated({ skipCancelled: true });
        return supply ? supply - tokensCreated : 0;
      },

      async isInvalidateable(tokenSerialNumber, referenceDate) {
        if (token?.invalidatedDate) return false;

        const slot = ercMetadataProperties?.slot;
        if (!slot) return true;

        const currentDate = new Date(referenceDate);

        const earliestEntry = new Date(slot);
        earliestEntry.setHours(earliestEntry.getHours() - 2);

        const latestEntry = new Date(slot);
        latestEntry.setHours(latestEntry.getHours() + 1);

        return (
          earliestEntry.getTime() < currentDate.getTime() &&
          latestEntry.getTime() > currentDate.getTime()
        );
      },

      tokenize: async () => {
        const chainId = configuration.find(({ key }) => key === 'chainId')?.value || undefined;
        const meta = { contractStandard, orderId: orderPosition?.orderId };
        const tokensCreated = await getTokensCreated();

        if (!orderPosition) {
          throw new Error('Order position not found in context');
        }

        if (contractStandard === 'ERC721') {
          // ERC721 is non-fungible, thus every tokenSerialNumber unique!
          const items = new Array(orderPosition.quantity).fill(null).map((_, i) => ({
            _id: generateDbObjectId(),
            tokenSerialNumber: Number(
              parseInt(MINTER_TOKEN_OFFSET, 10) + tokensCreated + (i + 1),
            ).toString(),
            contractAddress,
            quantity: 1,
            chainId,
            meta,
          }));
          return items;
        }
        // ERC1155 is fungible, allow the same tokenId
        return [
          {
            _id: generateDbObjectId(),
            tokenSerialNumber: tokenId!,
            contractAddress,
            quantity: orderPosition.quantity,
            chainId,
            meta,
          },
        ];
      },

      tokenMetadata: async (tokenSerialNumber) => {
        // Metadata standards supported
        // https://eips.ethereum.org/EIPS/eip-1155 (backward compatible with 721)
        // https://eips.ethereum.org/EIPS/eip-721

        if (!product) {
          throw new Error('Product not found in context');
        }

        return buildTokenMetadata({
          product,
          token,
          tokenSerialNumber,
          modules,
          locale,
          ercMetadataProperties,
          tokenId,
        });
      },
    };
  },
};
