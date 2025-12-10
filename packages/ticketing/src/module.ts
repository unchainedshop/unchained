import { createLogger } from '@unchainedshop/logger';
import { buildDbIndexes, type ModuleInput } from '@unchainedshop/mongodb';
import { MediaObjectsCollection } from '@unchainedshop/core-files';
import { TokenSurrogateCollection } from '@unchainedshop/core-warehousing';
import type { UnchainedCore } from '@unchainedshop/core';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import type { File } from '@unchainedshop/core-files';

import { RendererTypes, getRenderer } from './template-registry.ts';
import { buildPassBinary, pushToApplePushNotificationService } from './mobile-tickets/apple-wallet.ts';

export const APPLE_WALLET_PASSES_FILE_DIRECTORY = 'apple-wallet-passes';

const logger = createLogger('unchained:apple-wallet-webservice');

const configurePasses = async ({ db }: ModuleInput<Record<string, never>>) => {
  const MediaObjects = await MediaObjectsCollection(db);
  const TokenSurrogates = await TokenSurrogateCollection(db);

  await buildDbIndexes(TokenSurrogates as any, [
    { index: { 'meta.cancelled': 1 }, options: { sparse: true } },
  ]);

  await buildDbIndexes(MediaObjects as any, [
    { index: { path: 1, 'meta.passTypeIdentifier': 1, 'meta.serialNumber': 1 } },
    {
      index: {
        path: 1,
        'meta.passTypeIdentifier': 1,
        'meta.registrations.deviceLibraryIdentifier': 1,
      },
    } as any,
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

  const invalidateAppleWalletPasses = async (unchainedAPI: UnchainedCore) => {
    const allPasses = await MediaObjects.find({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
    }).toArray();
    const allTokens = await TokenSurrogates.find({}).toArray();

    for (const pass of allPasses) {
      // Check if binary is already invalidated, if so, skip
      const rawData = pass.meta?.rawData as TokenSurrogate;
      if (rawData.invalidatedDate) continue;

      const redeemedToken = allTokens.find((t) => t._id === rawData._id && t.invalidatedDate);

      // Find invalidated token for the binary, if found, invalidate binary
      if (redeemedToken) {
        logger.info('Ticket redeemed, void pass', rawData);
        await upsertAppleWalletPass(redeemedToken, unchainedAPI);
      }
    }
  };

  const buildMagicKey = async (orderId: string) => {
    const msgUint8 = new TextEncoder().encode([orderId, process.env.UNCHAINED_SECRET].join(''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    // Convert ArrayBuffer to hex string without using Buffer
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const cancelTicket = async (tokenId: string) => {
    return TokenSurrogates.findOneAndUpdate(
      { _id: tokenId },
      { $set: { 'meta.cancelled': true } },
      {
        returnDocument: 'after',
      },
    );
  };

  const isTicketCancelled = (token: TokenSurrogate) => {
    return Boolean(token.meta?.cancelled);
  };

  const getTicketsCreated = async (
    {
      productId,
    }: {
      productId: string;
    },
    { skipCancelled }: { skipCancelled?: boolean } = {},
  ): Promise<number> => {
    const selector: any = {
      productId,
    };
    if (skipCancelled) {
      selector['meta.cancelled'] = null;
    }
    return TokenSurrogates.countDocuments(selector);
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
    getTicketsCreated,
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
