import type { UnchainedCore } from '../../core-index.ts';
import toCSV from './toCSV.js';

const generateCSVFileAndURL = async ({
  rows,
  headers,
  directoryName,
  fileName,
  unchainedAPI,
}: {
  rows: any[];
  headers: string[];
  directoryName: string;
  fileName: string;
  unchainedAPI: UnchainedCore;
}, expires = 3600000) => {
  const csvString = toCSV(headers, rows);
  const normalizedExpiryTime = expires || 3600000
  const uploaded = await unchainedAPI.services.files.uploadFileFromStream({
    directoryName,
    rawFile: { filename: fileName, buffer: Buffer.from(csvString).toString('base64') },
  });

  const url = await unchainedAPI.services.files.createFileDownloadURL({
    file: uploaded,
    expires: normalizedExpiryTime,
  });
  return { url, expires: normalizedExpiryTime };
};

export default generateCSVFileAndURL;
