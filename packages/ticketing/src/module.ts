import { createLogger } from '@unchainedshop/logger';
import { buildDbIndexes, type ModuleInput, type mongodb } from '@unchainedshop/mongodb';
import { MediaObjectsCollection } from '@unchainedshop/core-files';
import { TokenSurrogateCollection } from '@unchainedshop/core-warehousing';
import { OrderPricingRowCategory, OrderPricingSheet, type UnchainedCore } from '@unchainedshop/core';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import type { File } from '@unchainedshop/core-files';

import { RendererTypes, getRenderer, hasRenderer } from './template-registry.ts';
import { buildPassBinary, pushToApplePushNotificationService } from './mobile-tickets/apple-wallet.ts';
import { type DiscountCodeHandlers, createDefaultDiscountCodeHandlers } from './discount-codes.ts';
import { registerTicketingEvents } from './events.ts';
import {
  OrderDiscountsCollection,
  OrderPositionsCollection,
  OrdersCollection,
  OrderStatus,
} from '@unchainedshop/core-orders';

export const APPLE_WALLET_PASSES_FILE_DIRECTORY = 'apple-wallet-passes';

const logger = createLogger('unchained:apple-wallet-webservice');

export interface TicketingOptions {
  discountCode?: DiscountCodeHandlers;
}

/** The last ticket serial handed out per product. */
interface TicketSerialCounter {
  _id: string;
  last: number;
  updated: Date;
}

const DUPLICATE_KEY_ERROR = 11000;

const notCancelled = { 'meta.cancelled': { $ne: true } };

// A pass file is outdated when its ticket was redeemed or cancelled after it was rendered.
const isAppleWalletPassOutdated = (rawData: TokenSurrogate | undefined, token: TokenSurrogate) =>
  !rawData ||
  Boolean(rawData.invalidatedDate) !== Boolean(token.invalidatedDate) ||
  Boolean(rawData.meta?.cancelled) !== Boolean(token.meta?.cancelled);

const configurePasses = async ({ db, options }: ModuleInput<TicketingOptions>) => {
  const discountCodeHandlers = options?.discountCode || createDefaultDiscountCodeHandlers();
  const MediaObjects = await MediaObjectsCollection(db);
  const TokenSurrogates = await TokenSurrogateCollection(db);
  const Orders = await OrdersCollection(db);
  const OrderPositions = await OrderPositionsCollection(db);
  const OrderDiscounts = await OrderDiscountsCollection(db);
  const TicketSerials = db.collection<TicketSerialCounter>('ticket_serials');

  registerTicketingEvents();

  await buildDbIndexes(MediaObjects as any, [
    { index: { path: 1, 'meta.passTypeIdentifier': 1, 'meta.serialNumber': 1 } },
    {
      index: {
        path: 1,
        'meta.passTypeIdentifier': 1,
        'meta.registrations.deviceLibraryIdentifier': 1,
      },
    } as any,
    { index: { path: 1, 'meta.rawData._id': 1, created: -1 } } as any,
  ]);

  const upsertAppleWalletPass = async (token: TokenSurrogate, unchainedAPI: UnchainedCore) => {
    const createAppleWalletPass = getRenderer(RendererTypes.APPLE_WALLET);
    const pass = await createAppleWalletPass(token, unchainedAPI);
    const rawFile = Promise.resolve(
      // wrap in promise to make stream upload work
      await buildPassBinary(token.tokenSerialNumber, pass as any),
    );

    const previousFile = await MediaObjects.findOne({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      'meta.passTypeIdentifier': pass.passTypeIdentifier,
      'meta.serialNumber': pass.serialNumber,
    });

    const registrations: any = previousFile?.meta?.registrations || [];
    const pkpassFile = await unchainedAPI.services.files.uploadFileFromStream({
      directoryName: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      rawFile,
      meta: {
        rawData: token,
        passTypeIdentifier: pass.passTypeIdentifier,
        serialNumber: pass.serialNumber,
        registrations,
      },
    });

    if (previousFile) {
      await unchainedAPI.services.files.removeFiles({
        fileIds: [previousFile._id],
      });
    }

    // Push updates!
    if (registrations?.length) {
      try {
        const pushTokens = registrations.map(({ pushToken }) => pushToken);
        logger.info(`Send update pass notification to ${pushTokens.join(',')}`);
        await pushToApplePushNotificationService(pushTokens);
      } catch (e) {
        logger.error(e);
      }
    }

    return pkpassFile;
  };

  const upsertGoogleWalletPass = async (token: TokenSurrogate, unchainedAPI: UnchainedCore) => {
    const createGoogleWalletPass = getRenderer(RendererTypes.GOOGLE_WALLET);
    const pass = await createGoogleWalletPass(token, unchainedAPI);
    return pass;
  };

  const findAppleWalletPass = async (passTypeIdentifier, serialNumber) => {
    const mediaObject = await MediaObjects.findOne({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      'meta.passTypeIdentifier': passTypeIdentifier,
      'meta.serialNumber': serialNumber,
    });
    return mediaObject;
  };

  const registerDeviceForAppleWalletPass = async (
    passTypeIdentifier,
    serialNumber,
    { deviceLibraryIdentifier, pushToken },
  ) => {
    const result = await MediaObjects.updateOne(
      {
        path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
        'meta.passTypeIdentifier': passTypeIdentifier,
        'meta.serialNumber': serialNumber,
        'meta.registrations.deviceLibraryIdentifier': {
          $ne: deviceLibraryIdentifier,
        },
      },
      {
        $push: {
          'meta.registrations': {
            deviceLibraryIdentifier,
            pushToken,
          },
        },
      },
    );
    return Boolean(result.modifiedCount);
  };

  const unregisterDeviceForAppleWalletPass = async (
    passTypeIdentifier,
    serialNumber,
    deviceLibraryIdentifier,
  ) => {
    const result = await MediaObjects.updateOne(
      {
        path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
        'meta.passTypeIdentifier': passTypeIdentifier,
        'meta.serialNumber': serialNumber,
        'meta.registrations.deviceLibraryIdentifier': deviceLibraryIdentifier,
      },
      {
        $pull: {
          'meta.registrations': {
            deviceLibraryIdentifier,
          },
        },
      },
    );
    return Boolean(result.modifiedCount);
  };

  const findUpdatedAppleWalletPasses = async (
    passTypeIdentifier,
    deviceLibraryIdentifier,
    passesUpdatedSince,
  ): Promise<File[]> => {
    const selector = {
      $or: [
        {
          updated: passesUpdatedSince ? { $gt: passesUpdatedSince } : { $exists: true },
        },
        {
          created: passesUpdatedSince ? { $gt: passesUpdatedSince } : { $exists: true },
        },
      ],
      'meta.registrations.deviceLibraryIdentifier': deviceLibraryIdentifier,
      'meta.passTypeIdentifier': passTypeIdentifier,
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
    };
    const updatedPasses = await MediaObjects.find(selector).toArray();
    return updatedPasses;
  };

  // Re-renders the pass of one ticket if the stored pass predates its redemption or cancellation.
  const refreshAppleWalletPass = async (tokenId: string, unchainedAPI: UnchainedCore) => {
    const latestPass = await MediaObjects.findOne(
      { path: APPLE_WALLET_PASSES_FILE_DIRECTORY, 'meta.rawData._id': tokenId },
      { sort: { created: -1 }, projection: { 'meta.rawData': 1 } },
    );
    // Tickets without a pass have nothing to void or push.
    if (!latestPass) return null;
    const token = await TokenSurrogates.findOne({ _id: tokenId });
    if (!token || !isAppleWalletPassOutdated(latestPass.meta?.rawData as TokenSurrogate, token)) {
      return null;
    }
    logger.info('Ticket redeemed or cancelled, void pass', { tokenId });
    return upsertAppleWalletPass(token, unchainedAPI);
  };

  // Finds the passes that are still valid while their ticket no longer is, loading ids only.
  const reconcileAppleWalletPasses = async (unchainedAPI: UnchainedCore) => {
    const openPasses = await MediaObjects.find(
      { path: APPLE_WALLET_PASSES_FILE_DIRECTORY, 'meta.rawData.invalidatedDate': null },
      { projection: { 'meta.rawData._id': 1 } },
    ).toArray();
    const tokenIds = [
      ...new Set(openPasses.map((pass) => (pass.meta?.rawData as TokenSurrogate)?._id)),
    ].filter(Boolean);
    if (!tokenIds.length) return;
    const outdatedTokens = await TokenSurrogates.find(
      { _id: { $in: tokenIds }, invalidatedDate: { $ne: null } },
      { projection: { _id: 1 } },
    ).toArray();
    for (const { _id } of outdatedTokens) {
      await refreshAppleWalletPass(_id, unchainedAPI);
    }
  };

  // Calls without a ticket arrive in bursts (one per ticket of a cancelled event), so they share
  // one running reconciliation plus at most one follow-up run instead of racing each other.
  let runningReconciliation: Promise<void> | null = null;
  let reconcileAgain = false;
  const reconcileAppleWalletPassesOnce = (unchainedAPI: UnchainedCore) => {
    if (runningReconciliation) {
      reconcileAgain = true;
      return runningReconciliation;
    }
    runningReconciliation = (async () => {
      try {
        do {
          reconcileAgain = false;
          await reconcileAppleWalletPasses(unchainedAPI);
        } while (reconcileAgain);
      } finally {
        runningReconciliation = null;
      }
    })();
    return runningReconciliation;
  };

  /**
   * Voids the Apple Wallet passes of redeemed or cancelled tickets and pushes the update to the
   * registered devices. Pass the ticket (e.g. the TOKEN_INVALIDATED payload) to refresh only its
   * pass; without one, all passes that are still valid are checked against their tickets.
   */
  const invalidateAppleWalletPasses = async (
    unchainedAPI: UnchainedCore,
    token?: Pick<TokenSurrogate, '_id'> | null,
  ): Promise<void> => {
    if (!hasRenderer(RendererTypes.APPLE_WALLET)) return;
    if (token?._id) {
      await refreshAppleWalletPass(token._id, unchainedAPI);
      return;
    }
    await reconcileAppleWalletPassesOnce(unchainedAPI);
  };

  const buildMagicKey = async (orderId: string) => {
    const msgUint8 = new TextEncoder().encode([orderId, process.env.UNCHAINED_SECRET].join(''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    // Convert ArrayBuffer to hex string without using Buffer
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  /**
   * Marks a ticket cancelled. With `onlyValid` the update only matches a ticket that is neither
   * redeemed nor cancelled yet, so a scan or another cancellation that got there first wins and
   * null is returned.
   */
  const cancelTicket = async (tokenId: string, { onlyValid }: { onlyValid?: boolean } = {}) => {
    return TokenSurrogates.findOneAndUpdate(
      { _id: tokenId, ...(onlyValid ? { invalidatedDate: null, ...notCancelled } : {}) },
      { $set: { 'meta.cancelled': true, 'meta.cancelledDate': new Date() } },
      {
        returnDocument: 'after',
      },
    );
  };

  const isTicketCancelled = (token: TokenSurrogate) => {
    return Boolean(token.meta?.cancelled);
  };

  const sumQuantity = async (
    collection: mongodb.Collection<any>,
    pipeline: mongodb.Document[],
  ): Promise<number> => {
    const [result] = await collection
      .aggregate([...pipeline, { $group: { _id: null, quantity: { $sum: '$quantity' } } }])
      .toArray();
    return result?.quantity || 0;
  };

  /** Issued ticket units of a product (token quantities, not token documents). */
  const countIssuedTickets = async (
    productId: string,
    { skipCancelled }: { skipCancelled?: boolean } = {},
  ): Promise<number> => {
    return sumQuantity(TokenSurrogates, [
      { $match: { productId, ...(skipCancelled ? notCancelled : {}) } },
    ]);
  };

  /** @deprecated Use countIssuedTickets(productId, { skipCancelled }), which it now calls. */
  const getTicketsCreated = async (
    {
      productId,
    }: {
      productId: string;
    },
    { skipCancelled }: { skipCancelled?: boolean } = {},
  ): Promise<number> => {
    return countIssuedTickets(productId, { skipCancelled });
  };

  /**
   * Units of a product that are gone: issued tickets that are not cancelled, plus the positions of
   * PENDING orders, which only get their tickets once they are confirmed. Carts do not count.
   */
  const countReservedTickets = async ({
    productId,
    excludeOrderId,
  }: {
    productId: string;
    excludeOrderId?: string;
  }): Promise<number> => {
    const [issued, pending] = await Promise.all([
      countIssuedTickets(productId, { skipCancelled: true }),
      sumQuantity(OrderPositions, [
        { $match: { productId, ...(excludeOrderId ? { orderId: { $ne: excludeOrderId } } : {}) } },
        { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
        { $match: { 'order.status': OrderStatus.PENDING } },
      ]),
    ]);
    return issued + pending;
  };

  const findHighestTicketSerial = async (productId: string): Promise<number | null> => {
    const [result] = await TokenSurrogates.aggregate([
      { $match: { productId } },
      {
        $group: {
          _id: null,
          highest: {
            $max: {
              $convert: { input: '$tokenSerialNumber', to: 'long', onError: null, onNull: null },
            },
          },
        },
      },
    ]).toArray();
    return result?.highest ?? null;
  };

  const seedTicketSerialCounter = async (productId: string, offset: number) => {
    const highestSerial = await findHighestTicketSerial(productId);
    const seed = Math.max(Number(highestSerial ?? offset), offset);
    try {
      await TicketSerials.updateOne(
        { _id: productId },
        { $max: { last: seed }, $set: { updated: new Date() } },
        { upsert: true },
      );
    } catch (error) {
      // Another reservation created the counter at the same time; $max never lowers it.
      if ((error as { code?: number })?.code !== DUPLICATE_KEY_ERROR) throw error;
      await TicketSerials.updateOne(
        { _id: productId },
        { $max: { last: seed }, $set: { updated: new Date() } },
      );
    }
  };

  /**
   * Hands out `count` consecutive ticket serials of a product, safe across concurrent checkouts.
   * The counter of a product starts after its highest numeric serial already issued, or after
   * `offset` if that is higher. Serials are unique and increasing, not necessarily gap-free.
   */
  const reserveTicketSerials = async (
    productId: string,
    count: number,
    { offset = 0 }: { offset?: number } = {},
  ): Promise<string[]> => {
    if (!(count > 0)) return [];
    const increment = () =>
      TicketSerials.findOneAndUpdate(
        { _id: productId },
        { $inc: { last: count }, $set: { updated: new Date() } },
        { returnDocument: 'after' },
      );
    let counter = await increment();
    if (!counter) {
      await seedTicketSerialCounter(productId, offset);
      counter = await increment();
    }
    if (!counter) {
      throw new Error(`Could not reserve ticket serials for product ${productId}`, {
        cause: 'TICKET_SERIALS_UNAVAILABLE',
      });
    }
    const first = counter.last - count + 1;
    return Array.from({ length: count }, (_, index) => String(first + index));
  };

  const discountCodeUsageBalance = async (
    discountCode: string,
    excludeOrderId?: string,
  ): Promise<number> => {
    const discounts = await OrderDiscounts.find({ code: discountCode }).toArray();
    const orderIds = [...new Set(discounts.map(({ orderId }) => orderId))].filter(
      (orderId): orderId is string => Boolean(orderId) && orderId !== excludeOrderId,
    );
    if (!orderIds.length) return 0;
    const orders = await Orders.find(
      {
        _id: { $in: orderIds },
        status: { $in: [null, OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.FULFILLED] },
      },
      { projection: { status: 1, currencyCode: 1, calculation: 1 } },
    ).toArray();
    const usage = orders.flatMap((order) =>
      discounts
        .filter(({ orderId }) => orderId === order._id)
        .map((discount) =>
          // Carts count the credit reserved at checkout, placed orders the discount rows they applied.
          order.status === null
            ? discount.reservation?.checkoutAmount || 0
            : Math.abs(
                OrderPricingSheet({
                  calculation: order.calculation,
                  currencyCode: order.currencyCode,
                }).sum({
                  category: OrderPricingRowCategory.Discounts,
                  discountId: discount._id,
                }),
              ),
        ),
    );
    return Math.round(usage.reduce((total, amount) => total + amount, 0));
  };

  return {
    upsertAppleWalletPass,
    findAppleWalletPass,
    registerDeviceForAppleWalletPass,
    unregisterDeviceForAppleWalletPass,
    findUpdatedAppleWalletPasses,
    invalidateAppleWalletPasses,
    upsertGoogleWalletPass,
    buildMagicKey,
    cancelTicket,
    isTicketCancelled,
    countIssuedTickets,
    countReservedTickets,
    reserveTicketSerials,
    getTicketsCreated,
    generateDiscountCode: discountCodeHandlers.generate,
    verifyDiscountCode: discountCodeHandlers.verify,
    discountCodeUsageBalance,
  };
};

export interface TicketingModule {
  passes: Awaited<ReturnType<typeof configurePasses>>;
}

export default {
  passes: {
    configure: configurePasses,
  },
};
