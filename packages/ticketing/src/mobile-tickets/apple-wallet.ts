import apn from '@parse/node-apn';
import { Readable } from 'node:stream';

export const pushToApplePushNotificationService = async (deviceTokens) => {
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
  chainTokenId: string,
  pass: {
    serialNumber: string;
    asBuffer: () => Promise<Buffer>;
  },
) => {
  const passBuffer = await pass.asBuffer();
  const rawFile = {
    _id: pass.serialNumber,
    filename: `${chainTokenId}-${new Date().getTime()}.pkpass`,
    createReadStream: () => Readable.from(passBuffer),
    mimetype: 'application/vnd.apple.pkpass',
  };
  return rawFile;
};
