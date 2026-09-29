import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { RendererTypes, hasRenderer } from './template-registry.ts';
import { getTicketingPaths } from './routes.ts';
import type { TicketingAPI } from './index.ts';

/** An e-mail attachment the EMAIL worker downloads from the engine when it sends the message. */
export interface TicketAttachment {
  filename: string;
  href: string;
}

// ROOT_URL is the public URL of the engine, the one the ticketing routes are served on.
const resolveRootUrl = (rootUrl?: string) =>
  (rootUrl || process.env.ROOT_URL || 'http://localhost:4010').replace(/\/+$/, '');

const buildUrl = (rootUrl: string, path: string, params: Record<string, string | undefined>) => {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  return `${rootUrl}${path}?${query}`;
};

/**
 * Link to the tickets PDF of an order, with the order's magic key as otp so it opens without a session.
 * The key never expires, rotating UNCHAINED_SECRET revokes all links. Null if no PDF renderer is registered.
 */
export async function buildTicketsPdfUrl(
  orderId: string,
  context: TicketingAPI,
  { variant, rootUrl }: { variant?: string; rootUrl?: string } = {},
): Promise<string | null> {
  if (!hasRenderer(RendererTypes.ORDER_PDF)) return null;
  const otp = await context.modules.passes.buildMagicKey(orderId);
  return buildUrl(resolveRootUrl(rootUrl), getTicketingPaths().printTickets, { orderId, otp, variant });
}

/** Wallet download links of a ticket, only for the wallets that have a registered renderer. */
export async function buildWalletPassUrls(
  token: TokenSurrogate,
  context: TicketingAPI,
  { rootUrl }: { rootUrl?: string } = {},
): Promise<{ appleWallet?: string; googleWallet?: string }> {
  const withAppleWallet = hasRenderer(RendererTypes.APPLE_WALLET);
  const withGoogleWallet = hasRenderer(RendererTypes.GOOGLE_WALLET);
  if (!withAppleWallet && !withGoogleWallet) return {};

  const hash = await context.modules.warehousing.buildAccessKeyFromToken(token);
  const root = resolveRootUrl(rootUrl);
  const paths = getTicketingPaths();
  const tokenId = encodeURIComponent(token._id);
  return {
    ...(withAppleWallet && {
      appleWallet: buildUrl(root, `${paths.appleWallet}/download/${tokenId}.pkpass`, { hash }),
    }),
    ...(withGoogleWallet && {
      googleWallet: buildUrl(root, `${paths.googleWallet}/download/${tokenId}`, { hash }),
    }),
  };
}

/**
 * Attachments for an order's ticket e-mail: the tickets PDF (unless pdf is false) and, with
 * appleWalletPasses, one pkpass per ticket that is not cancelled. Links whose renderer is not
 * registered are left out, because a failing attachment download fails the whole e-mail.
 */
export async function getTicketAttachments(
  orderId: string,
  context: TicketingAPI,
  {
    pdf = {},
    appleWalletPasses = false,
    rootUrl,
  }: {
    pdf?: false | { filename?: string; variant?: string };
    appleWalletPasses?: boolean;
    rootUrl?: string;
  } = {},
): Promise<TicketAttachment[]> {
  const attachments: TicketAttachment[] = [];

  if (pdf) {
    const href = await buildTicketsPdfUrl(orderId, context, { variant: pdf.variant, rootUrl });
    if (href) attachments.push({ filename: pdf.filename || 'tickets.pdf', href });
  }

  if (appleWalletPasses && hasRenderer(RendererTypes.APPLE_WALLET)) {
    const orderPositions = await context.modules.orders.positions.findOrderPositions({ orderId });
    const tokens = orderPositions.length
      ? await context.modules.warehousing.findTokens({
          orderPositionId: { $in: orderPositions.map(({ _id }) => _id) },
        })
      : [];
    for (const token of tokens) {
      if (token.meta?.cancelled) continue;
      const { appleWallet } = await buildWalletPassUrls(token, context, { rootUrl });
      if (appleWallet) attachments.push({ filename: `ticket-${token._id}.pkpass`, href: appleWallet });
    }
  }

  return attachments;
}
