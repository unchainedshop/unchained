import {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { ProductType, ProductContractStandard } from '@unchainedshop/types/products';
import { IWarehousingAdapter, WarehousingError } from '@unchainedshop/types/warehousing';
import { generateDbObjectId, systemLocale } from '@unchainedshop/utils';

const { MINTER_TOKEN_OFFSET = '0' } = process.env;

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
    const { product, orderPosition, token, modules, localeContext } = context;
    return {
      ...WarehousingAdapter.actions(configuration, context),

      isActive() {
        return product?.type === ProductType.TokenizedProduct;
      },

      configurationError() {
        return null as any as WarehousingError;
      },

      stock: async () => {
        const existingTokens = await modules.warehousing.findTokens(
          product.tokenization.contractStandard === 'ERC721'
            ? { contractAddress: product.tokenization.contractAddress }
            : {
                contractAddress: product.tokenization.contractAddress,
                chainTokenId: product.tokenization.tokenId,
              },
        );
        const tokensCreated = existingTokens.reduce((acc, curToken) => {
          return acc + curToken.quantity;
        }, 0);

        return product?.tokenization?.supply ? product.tokenization.supply - tokensCreated : 0;
      },

      tokenize: async () => {
        // Upload Image to IPFS
        // Upload Metadata to IPFS
        // Prepare metadata

        const chainId = configuration.find(({ key }) => key === 'chainId')?.value || undefined;
        const { contractAddress, contractStandard, tokenId } = product?.tokenization || {};
        const _id = generateDbObjectId();
        const meta = { contractStandard };

        const existingTokens = await modules.warehousing.findTokens(
          product.tokenization.contractStandard === 'ERC721'
            ? { contractAddress: product.tokenization.contractAddress }
            : {
                contractAddress: product.tokenization.contractAddress,
                chainTokenId: product.tokenization.tokenId,
              },
        );
        const tokensCreated = existingTokens.reduce((acc, curToken) => {
          return acc + curToken.quantity;
        }, 0);

        if (contractStandard === 'ERC721') {
          // ERC721 is non-fungible, thus every _id unique!
          return new Array(orderPosition?.quantity).fill(null).map((_, i) => ({
            _id,
            chainTokenId: Number(parseInt(MINTER_TOKEN_OFFSET, 10) + tokensCreated + (i + 1)).toString(),
            contractAddress,
            quantity: 1,
            chainId,
            meta,
          }));
        }
        // ERC1155 is fungible, allow the same tokenId
        return [
          {
            _id,
            chainTokenId: tokenId,
            contractAddress,
            quantity: orderPosition?.quantity,
            chainId,
            meta,
          },
        ];
      },

      tokenMetadata: async () => {
        // if ERC721 -> tokenUri
        // if ERC1155 -> uri
        // -> use the contract to get the correct metadata uri from tokenId

        // depending on the ERC, build the correct metadata json schema
        // https://eips.ethereum.org/EIPS/eip-1155
        // https://eips.ethereum.org/EIPS/eip-721

        const allLanguages = await modules.languages.findLanguages({
          includeInactive: false,
        });

        const [firstMedia] = await modules.products.media.findProductMedias({
          productId: product._id,
          limit: 1,
        });
        const file = firstMedia && (await modules.files.findFile({ fileId: firstMedia.mediaId }));
        const url = file && (await modules.files.getUrl(file, {}));
        const text = await modules.products.texts.findLocalizedText({
          productId: product._id,
          locale: localeContext.normalized,
        });

        if (product.tokenization.contractStandard === ProductContractStandard.ERC1155) {
          const isDefaultLanguageActive = localeContext.language === systemLocale.language;
          const localization = isDefaultLanguageActive
            ? {
                uri: `${process.env.ROOT_URL}/erc-metadata/${product._id}/{locale}/${product.tokenization.tokenId}.json`,
                default: systemLocale.language,
                locales: allLanguages.map((lang) => lang.isoCode),
              }
            : undefined;

          return {
            name: `${text.title} #${token.chainTokenId}`,
            description: text.description,
            image: url,
            properties: product.meta,
            localization,
          };
        }
        return {
          name: text.title,
          description: text.description,
          image: url,
        };
      },
    };
  },
};

WarehousingDirector.registerAdapter(ETHMinter);
