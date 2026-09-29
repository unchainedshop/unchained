import { Readable } from 'node:stream';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:apple-wallet-webservice');

let apnModule: Promise<any> | undefined;

// The optional peer is loaded on the first push, so importing ticketing has no side effects.
const loadApn = () => {
  apnModule ??= import('@parse/node-apn').then(
    (module) => module.default,
    (error) => {
      apnModule = undefined;
      if (
        (error as { code?: string })?.code === 'ERR_MODULE_NOT_FOUND' &&
        String((error as Error)?.message).includes('@parse/node-apn')
      ) {
        throw new Error(
          "npm dependency '@parse/node-apn' is not installed, please install it to push pass updates",
        );
      }
      // An installed apn that fails to load is a real error, not a missing peer.
      logger.error(`failed to load '@parse/node-apn'`, error);
      throw error;
    },
  );
  return apnModule;
};

export const pushToApplePushNotificationService = async (deviceTokens: string[]) => {
  const apn = await loadApn();

  const apnProvider = new apn.Provider({
    cert: process.env.PASS_CERTIFICATE_PATH,
    key: process.env.PASS_CERTIFICATE_PATH,
    passphrase: process.env.PASS_CERTIFICATE_SECRET,
    production: true,
  });

  try {
    const note = new apn.Notification({});
    return await apnProvider.send(note, deviceTokens);
  } finally {
    // Every push opens its own HTTP/2 session to APNs; close it again.
    await apnProvider.shutdown();
  }
};

export const buildPassBinary = async (
  tokenSerialNumber: string,
  pass: {
    serialNumber: string;
    asBuffer: () => Promise<Buffer>;
  },
) => {
  const passBuffer = await pass.asBuffer();
  const rawFile = {
    _id: pass.serialNumber,
    filename: `${tokenSerialNumber}-${new Date().getTime()}.pkpass`,
    createReadStream: () => Readable.from(passBuffer),
    mimetype: 'application/vnd.apple.pkpass',
  };
  return rawFile;
};
