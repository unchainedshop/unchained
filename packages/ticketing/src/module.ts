import { createLogger } from '@unchainedshop/logger';
import type { UnchainedCore } from '@unchainedshop/core';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import type { File } from '@unchainedshop/core-files';

import { RendererTypes, getRenderer } from './template-registry.ts';
import { buildPassBinary, pushToApplePushNotificationService } from './mobile-tickets/apple-wallet.ts';

export const APPLE_WALLET_PASSES_FILE_DIRECTORY = 'apple-wallet-passes';

const logger = createLogger('unchained:apple-wallet-webservice');

// Module-level reference to unchainedAPI, set during configuration
let unchainedAPIRef: UnchainedCore | null = null;

export const setUnchainedAPIRef = (api: UnchainedCore) => {
  unchainedAPIRef = api;
};

const getUnchainedAPI = (): UnchainedCore => {
  if (!unchainedAPIRef) {
    throw new Error('Ticketing module not configured. Call setupTicketing first.');
  }
  return unchainedAPIRef;
};

const configurePasses = async () => {
  const upsertAppleWalletPass = async (token: TokenSurrogate) => {
    const api = getUnchainedAPI();
    const createAppleWalletPass = getRenderer(RendererTypes.APPLE_WALLET);
    const pass = await createAppleWalletPass(token, api);
    const rawFile = Promise.resolve(
      // wrap in promise to make stream upload work
      await buildPassBinary(token.tokenSerialNumber, pass as any),
    );

    const previousFiles = await api.modules.files.findFiles({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      meta: {
        passTypeIdentifier: (pass as any).passTypeIdentifier,
        serialNumber: (pass as any).serialNumber,
      },
    });
    const previousFile = previousFiles[0];

    const registrations: any = previousFile?.meta?.registrations || [];
    const pkpassFile = await api.services.files.uploadFileFromStream({
      directoryName: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      rawFile,
      meta: {
        rawData: token,
        passTypeIdentifier: (pass as any).passTypeIdentifier,
        serialNumber: (pass as any).serialNumber,
        registrations,
      },
    });

    if (previousFile) {
      await api.services.files.removeFiles({
        fileIds: [previousFile._id],
      });
    }

    // Push updates!
    if (registrations?.length) {
      try {
        const pushTokens = registrations.map(({ pushToken }: { pushToken: string }) => pushToken);
        logger.info(`Send update pass notification to ${pushTokens.join(',')}`);
        await pushToApplePushNotificationService(pushTokens);
      } catch (e) {
        logger.error(e);
      }
    }

    return pkpassFile;
  };

  const upsertGoogleWalletPass = async (token: TokenSurrogate) => {
    const api = getUnchainedAPI();
    const createGoogleWalletPass = getRenderer(RendererTypes.GOOGLE_WALLET);
    const pass = await createGoogleWalletPass(token, api);
    return pass;
  };

  const findAppleWalletPass = async (passTypeIdentifier: string, serialNumber: string) => {
    const api = getUnchainedAPI();
    const files = await api.modules.files.findFiles({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      meta: {
        passTypeIdentifier,
        serialNumber,
      },
    });
    return files[0] || null;
  };

  const registerDeviceForAppleWalletPass = async (
    passTypeIdentifier: string,
    serialNumber: string,
    { deviceLibraryIdentifier, pushToken }: { deviceLibraryIdentifier: string; pushToken: string },
  ) => {
    const api = getUnchainedAPI();
    const files = await api.modules.files.findFiles({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      meta: {
        passTypeIdentifier,
        serialNumber,
      },
    });
    const file = files[0];
    if (!file) return false;

    const registrations: any[] = (file.meta as any)?.registrations || [];
    const alreadyRegistered = registrations.some(
      (r: any) => r.deviceLibraryIdentifier === deviceLibraryIdentifier,
    );

    if (alreadyRegistered) return false;

    registrations.push({ deviceLibraryIdentifier, pushToken });

    await api.modules.files.update(file._id, {
      meta: {
        ...(file.meta as any),
        registrations,
      },
    });

    return true;
  };

  const unregisterDeviceForAppleWalletPass = async (
    passTypeIdentifier: string,
    serialNumber: string,
    deviceLibraryIdentifier: string,
  ) => {
    const api = getUnchainedAPI();
    const files = await api.modules.files.findFiles({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      meta: {
        passTypeIdentifier,
        serialNumber,
      },
    });
    const file = files[0];
    if (!file) return false;

    const registrations: any[] = (file.meta as any)?.registrations || [];
    const newRegistrations = registrations.filter(
      (r: any) => r.deviceLibraryIdentifier !== deviceLibraryIdentifier,
    );

    if (newRegistrations.length === registrations.length) return false;

    await api.modules.files.update(file._id, {
      meta: {
        ...(file.meta as any),
        registrations: newRegistrations,
      },
    });

    return true;
  };

  const findUpdatedAppleWalletPasses = async (
    passTypeIdentifier: string,
    deviceLibraryIdentifier: string,
    passesUpdatedSince: Date | null,
  ): Promise<File[]> => {
    const api = getUnchainedAPI();
    // Get all passes for this device
    const allPasses = await api.modules.files.findFiles({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
      meta: {
        passTypeIdentifier,
      },
    });

    // Filter by device registration and update time
    return allPasses.filter((pass) => {
      const registrations: any[] = (pass.meta as any)?.registrations || [];
      const isRegistered = registrations.some(
        (r: any) => r.deviceLibraryIdentifier === deviceLibraryIdentifier,
      );
      if (!isRegistered) return false;

      if (!passesUpdatedSince) return true;

      const updateDate = pass.updated || pass.created;
      return updateDate > passesUpdatedSince;
    });
  };

  const invalidateAppleWalletPasses = async () => {
    const api = getUnchainedAPI();
    const allPasses = await api.modules.files.findFiles({
      path: APPLE_WALLET_PASSES_FILE_DIRECTORY,
    });
    const allTokens = await api.modules.warehousing.findTokens({});

    for (const pass of allPasses) {
      // Check if binary is already invalidated, if so, skip
      const rawData = (pass.meta as any)?.rawData as TokenSurrogate;
      if (!rawData || rawData.invalidatedDate) continue;

      const redeemedToken = allTokens.find((t) => t._id === rawData._id && t.invalidatedDate);

      // Find invalidated token for the binary, if found, invalidate binary
      if (redeemedToken) {
        logger.info('Ticket redeemed, void pass', rawData);
        await upsertAppleWalletPass(redeemedToken);
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
    const api = getUnchainedAPI();
    const token = await api.modules.warehousing.findToken({ tokenId });
    if (!token) return null;

    // Invalidate the token (marks it as cancelled)
    return api.modules.warehousing.invalidateToken(tokenId);
  };

  const isTicketCancelled = (token: TokenSurrogate) => {
    return Boolean(token.meta?.cancelled || token.invalidatedDate);
  };

  const getTicketsCreated = async (
    {
      productId,
    }: {
      productId: string;
    },
    { skipCancelled }: { skipCancelled?: boolean } = {},
  ): Promise<number> => {
    const api = getUnchainedAPI();
    if (skipCancelled) {
      const tokens = await api.modules.warehousing.findTokens({
        productId,
        'meta.cancelled': null,
      });
      return tokens.length;
    }
    return api.modules.warehousing.tokensCount({ productId });
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
