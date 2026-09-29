import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import { ProductType } from '@unchainedshop/core-products';
import { systemLocale } from '@unchainedshop/utils';

const logger = createLogger('unchained:erc-metadata');

// EIP-721 / EIP-1155 metadata keys. This route is public: everything else an adapter returns
// (e.g. token.meta with order ids or attendee data) stays behind the authorized GraphQL API.
export const PUBLIC_ERC_METADATA_KEYS = [
  'name',
  'description',
  'image',
  'properties',
  'attributes',
  'localization',
  'external_url',
  'animation_url',
  'background_color',
  'decimals',
] as const;

const pickPublicErcMetadata = (ercMetadata: Record<string, unknown>) =>
  Object.fromEntries(
    PUBLIC_ERC_METADATA_KEYS.filter((key) => ercMetadata[key] !== undefined).map((key) => [
      key,
      ercMetadata[key],
    ]),
  );

export async function ercMetadataHandler(
  request: Request,
  context: UnchainedCore & {
    params: Record<string, string>;
    locale?: Intl.Locale;
    loaders?: {
      productLoader: {
        load: (params: { productId: string }) => Promise<any>;
      };
    };
  },
): Promise<Response> {
  try {
    const { ROOT_URL = 'http://localhost:4010' } = process.env;
    const { services, modules, locale, loaders, params } = context;

    const url = new URL(request.url, ROOT_URL);

    // Validate .json extension
    if (!url.pathname.toLowerCase().endsWith('.json')) {
      throw new Error('Invalid ERC Metadata URI');
    }

    const { productId, localeOrTokenFilename, tokenFileName } = params;

    // Load product - loaders are set by API context middleware
    const product = loaders
      ? await loaders.productLoader.load({ productId })
      : await modules.products.findProduct({ productId });

    if (product?.type !== ProductType.TOKENIZED_PRODUCT) {
      return new Response(null, { status: 404 });
    }

    // One token of this product per serial, for ERC721 and ERC1155 alike. Several products can
    // share a contract address (off-chain tickets all use a placeholder), so the address alone
    // would return any product's token.
    const tokenSerialNumber = (tokenFileName || localeOrTokenFilename).replace(/\.json$/i, '');
    const [token] = await modules.warehousing.findTokens(
      { productId: product._id, tokenSerialNumber },
      { limit: 1 },
    );
    if (!token) {
      return new Response(null, { status: 404 });
    }

    // Determine locale: use path parameter if tokenFileName exists, otherwise fall back to context locale
    const resolvedLocale = tokenFileName
      ? new Intl.Locale(localeOrTokenFilename)
      : locale || systemLocale;

    const ercMetadata = await services.warehousing.ercMetadata({
      product,
      token,
      locale: resolvedLocale,
    });

    if (!ercMetadata) {
      return new Response(null, { status: 404 });
    }

    return Response.json(pickPublicErcMetadata(ercMetadata), { status: 200 });
  } catch (e: any) {
    logger.error(e);
    return Response.json({ name: e.name, code: e.code, message: e.message }, { status: 503 });
  }
}
