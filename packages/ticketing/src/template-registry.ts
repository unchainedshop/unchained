import type { UnchainedCore } from '@unchainedshop/core';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';

export type PDFRenderer = (
  {
    orderId,
    variant,
  }: {
    orderId: string;
    variant?: string;
  },
  context: UnchainedCore,
) => Promise<NodeJS.ReadableStream>;

export type PassRenderer = (
  token: TokenSurrogate,
  context: UnchainedCore,
) => Promise<{
  asURL: () => Promise<string>;
  asBuffer: () => Promise<Buffer>;
  serialNumber?: string;
  passTypeIdentifier?: string;
}>;

export const RendererTypes = {
  GOOGLE_WALLET: 'google-wallet',
  APPLE_WALLET: 'apple-wallet',
  ORDER_PDF: 'order',
} as const;

export type RendererTypes = (typeof RendererTypes)[keyof typeof RendererTypes];

export const renderers = new Map<string, PDFRenderer | PassRenderer>();

export type RegisterRendererFn = ((
  type: typeof RendererTypes.ORDER_PDF,
  renderer: PDFRenderer,
) => void) &
  ((
    type: typeof RendererTypes.GOOGLE_WALLET | typeof RendererTypes.APPLE_WALLET,
    renderer: PassRenderer,
  ) => void);

export const registerRenderer: RegisterRendererFn = function registerRenderer(
  type: RendererTypes,
  renderer: PDFRenderer | PassRenderer,
) {
  console.log('registered renderer  for ', type, renderer)
  renderers.set(type, renderer);
};

export type GetRendererFn = ((type: typeof RendererTypes.ORDER_PDF) => PDFRenderer) &
  ((type: typeof RendererTypes.GOOGLE_WALLET | typeof RendererTypes.APPLE_WALLET) => PassRenderer);

export const getRenderer: GetRendererFn = function getRenderer(type: RendererTypes) {
  console.log('get renderer for ', type, renderers.get(type))
  return renderers.get(type) as any;
};
