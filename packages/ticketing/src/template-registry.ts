import { UnchainedCore } from '@unchainedshop/types/core.js';
import { TokenSurrogate } from '@unchainedshop/core-warehousing';

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
  asURL?: () => Promise<string>;
  asBuffer?: () => Promise<Buffer>;
  serialNumber?: string;
  passTypeIdentifier?: string;
}>;

export enum RendererTypes {
  GOOGLE_WALLET = 'google-wallet',
  APPLE_WALLET = 'apple-wallet',
  ORDER_PDF = 'order',
}

export const renderers = new Map<string, PDFRenderer | PassRenderer>();

export type RegisterRendererFn = ((type: RendererTypes.ORDER_PDF, renderer: PDFRenderer) => void) &
  ((type: RendererTypes.GOOGLE_WALLET | RendererTypes.APPLE_WALLET, renderer: PassRenderer) => void);

export const registerRenderer: RegisterRendererFn = function registerRenderer(
  type: RendererTypes,
  renderer: PDFRenderer | PassRenderer,
) {
  renderers.set(type, renderer);
};

export type GetRendererFn = ((type: RendererTypes.ORDER_PDF) => PDFRenderer) &
  ((type: RendererTypes.GOOGLE_WALLET | RendererTypes.APPLE_WALLET) => PassRenderer);

export const getRenderer: GetRendererFn = function getRenderer(type: RendererTypes) {
  return renderers.get(type) as any;
};
