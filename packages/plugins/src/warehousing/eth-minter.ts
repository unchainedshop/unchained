import {
  UnchainedCore,
  IWarehousingAdapter,
  WarehousingContext,
  WarehousingError,
  WarehousingDirector,
  WarehousingAdapter,
} from '@unchainedshop/core';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { ProductContractStandard, ProductTypes } from '@unchainedshop/core-products';
import { systemLocale } from '@unchainedshop/utils';
import { generateDbObjectId } from '@unchainedshop/mongodb';
import { getFileAdapter } from '@unchainedshop/core-files';

const { MINTER_TOKEN_OFFSET = '0', ROOT_URL = 'http://localhost:4010' } = process.env;

const ETHMinter: IWarehousingAdapter = {
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
    const { product, orderPosition, token, modules, locale } = context as WarehousingContext &
      UnchainedCore;
    const { contractAddress, contractStandard, tokenId, supply, ercMetadataProperties } =
      product?.tokenization || {};

    const getTokensCreated = async () => {
      const existingTokens = await modules.warehousing.findTokens(
        contractStandard === ProductContractStandard.ERC721
          ? { contractAddress: contractStandard }
          : {
              contractAddress: contractStandard,
              chainTokenId: tokenId,
            },
      );
      const tokensCreated = existingTokens.reduce((acc, curToken) => {
        return acc + curToken.quantity;
      }, 0);
      return tokensCreated;
    };

    return {
      ...WarehousingAdapter.actions(configuration, context),

      isActive() {
        return product?.type === ProductTypes.TokenizedProduct;
      },

      configurationError() {
        return null as any as WarehousingError;
      },

      stock: async () => {
        const tokensCreated = await getTokensCreated();
        return supply ? supply - tokensCreated : 0;
      },

      tokenize: async () => {
        // Upload Image to IPFS
        // Upload Metadata to IPFS
        // Prepare metadata

        const chainId = configuration.find(({ key }) => key === 'chainId')?.value || undefined;
        const meta = { contractStandard };
        const tokensCreated = await getTokensCreated();

        if (contractStandard === 'ERC721') {
          // ERC721 is non-fungible, thus every chainTokenId unique!
          const items = new Array(orderPosition?.quantity).fill(null).map((_, i) => ({
            _id: generateDbObjectId(),
            chainTokenId: Number(parseInt(MINTER_TOKEN_OFFSET, 10) + tokensCreated + (i + 1)).toString(),
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
            chainTokenId: tokenId,
            contractAddress,
            quantity: orderPosition?.quantity,
            chainId,
            meta,
          },
        ];
      },

      tokenMetadata: async (chainTokenId) => {
        // Metadata standards supported
        // https://eips.ethereum.org/EIPS/eip-1155 (backward compatible with 721)
        // https://eips.ethereum.org/EIPS/eip-721

        const allLanguages = await modules.languages.findLanguages({
          includeInactive: false,
        });

        const [firstMedia] = await modules.products.media.findProductMedias({
          productId: product._id,
          limit: 1,
        });
        const file = firstMedia && (await modules.files.findFile({ fileId: firstMedia.mediaId }));

        const fileUploadAdapter = getFileAdapter();
        const signedUrl = await fileUploadAdapter.createDownloadURL(file);
        const url = signedUrl && (await modules.files.normalizeUrl(signedUrl, {}));
        const text = await modules.products.texts.findLocalizedText({
          productId: product._id,
          locale: locale || systemLocale,
        });

        const name = `${text.title} #${chainTokenId}`;

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
      },
    };
  },
};

WarehousingDirector.registerAdapter(ETHMinter);
