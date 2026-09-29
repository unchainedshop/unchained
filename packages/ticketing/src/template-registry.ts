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

/** Renders the Apple Wallet pass of a ticket. */
export type PassRenderer = (
  token: TokenSurrogate,
  context: UnchainedCore,
) => Promise<{
  asURL: () => Promise<string>;
  asBuffer: () => Promise<Buffer>;
  serialNumber?: string;
  passTypeIdentifier?: string;
}>;

/**
 * Returns the Google Wallet save link of a ticket, either as a string or as an object with asURL().
 * Returning null or undefined answers the download route with 404.
 */
export type GoogleWalletPassRenderer = (
  token: TokenSurrogate,
  context: UnchainedCore,
) => Promise<string | { asURL: () => Promise<string> } | null | undefined>;

export const RendererTypes = {
  GOOGLE_WALLET: 'google-wallet',
  APPLE_WALLET: 'apple-wallet',
  ORDER_PDF: 'order',
} as const;

export type RendererTypes = (typeof RendererTypes)[keyof typeof RendererTypes];

export const renderers = new Map<string, PDFRenderer | PassRenderer | GoogleWalletPassRenderer>();

export type RegisterRendererFn = ((
  type: typeof RendererTypes.ORDER_PDF,
  renderer: PDFRenderer | null | undefined,
) => void) &
  ((type: typeof RendererTypes.APPLE_WALLET, renderer: PassRenderer | null | undefined) => void) &
  ((
    type: typeof RendererTypes.GOOGLE_WALLET,
    renderer: GoogleWalletPassRenderer | null | undefined,
  ) => void);

/** Registers a renderer; passing no renderer removes the registered one. */
export const registerRenderer: RegisterRendererFn = function registerRenderer(
  type: RendererTypes,
  renderer: PDFRenderer | PassRenderer | GoogleWalletPassRenderer | null | undefined,
) {
  if (renderer) renderers.set(type, renderer);
  else renderers.delete(type);
};

export type GetRendererFn = ((type: typeof RendererTypes.ORDER_PDF) => PDFRenderer) &
  ((type: typeof RendererTypes.APPLE_WALLET) => PassRenderer) &
  ((type: typeof RendererTypes.GOOGLE_WALLET) => GoogleWalletPassRenderer);

/** Returns the registered renderer; check hasRenderer() first, it is undefined when none is registered. */
export const getRenderer: GetRendererFn = function getRenderer(type: RendererTypes) {
  return renderers.get(type) as any;
};

export const hasRenderer = (type: RendererTypes) => renderers.has(type);
