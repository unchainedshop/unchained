import { ERCMetadataService, ProductContractStandard } from '@unchainedshop/types/products';
import { systemLocale } from '@unchainedshop/utils';

export const ercMetadataService: ERCMetadataService = async ({ product, locale }, { modules }) => {
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
    locale: locale.normalized,
  });

  if (product.tokenization.contractStandard === ProductContractStandard.ERC1155) {
    const isDefaultLanguageActive = locale.language === systemLocale.language;
    const localization = isDefaultLanguageActive
      ? {
          uri: `${process.env.ROOT_URL}/erc-metadata/${product.tokenization.tokenId}/{locale}.json`,
          default: systemLocale.language,
          locales: allLanguages.map((lang) => lang.isoCode),
        }
      : undefined;

    return {
      name: text.title,
      description: text.description,
      image: url,
      properties: product.meta,
      localization,
      // decimals:
    };
  }
  return {
    name: text.title,
    description: text.description,
    image: url,
  };
};
