import { Readable } from 'node:stream';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:apple-wallet-webservice');

let apn;
try {
  const module = await import('@parse/node-apn');
  apn = module.default;
} catch (error) {
  if (
    (error as { code?: string })?.code === 'ERR_MODULE_NOT_FOUND' &&
    String((error as Error)?.message).includes('@parse/node-apn')
  ) {
    logger.warn(
      `optional peer npm package '@parse/node-apn' not installed, apple wallet pass update notifications will not work`,
    );
  } else {
    // An installed apn that fails to load is a real error, not a missing peer.
    logger.error(`failed to load '@parse/node-apn'`, error);
  }
}

export const pushToApplePushNotificationService = async (deviceTokens) => {
  if (!apn) {
    throw new Error(
      "npm dependency '@parse/node-apn' is not installed, please install it to push pass updates",
    );
  }

  const apnProvider = new apn.Provider({
    cert: process.env.PASS_CERTIFICATE_PATH,
    key: process.env.PASS_CERTIFICATE_PATH,
    passphrase: process.env.PASS_CERTIFICATE_SECRET,
    production: true,
  });

  const note = new apn.Notification({});
  return apnProvider.send(note, deviceTokens);
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
