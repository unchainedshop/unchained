import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import { ProductContractStandard } from '@unchainedshop/core-products';
import { systemLocale } from '@unchainedshop/utils';

const logger = createLogger('unchained:erc-metadata');

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

    const tokenSelector: { contractAddress?: string; tokenSerialNumber?: string } = {
      contractAddress: product?.tokenization?.contractAddress,
    };

    // For non-ERC721 tokens, extract serial number from filename
    if (product?.tokenization?.contractStandard !== ProductContractStandard.ERC721) {
      tokenSelector.tokenSerialNumber = (tokenFileName || localeOrTokenFilename)
        .toLowerCase()
        .replace('.json', '');
    }

    const [token] = await modules.warehousing.findTokens(tokenSelector);

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

    return Response.json(ercMetadata, { status: 200 });
  } catch (e: any) {
    logger.error(e);
    return Response.json({ name: e.name, code: e.code, message: e.message }, { status: 503 });
  }
}
