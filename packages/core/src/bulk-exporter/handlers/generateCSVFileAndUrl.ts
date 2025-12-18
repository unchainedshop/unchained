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
}) => {
  const csvString = toCSV(headers, rows);
  const uploaded = await unchainedAPI.services.files.uploadFileFromStream({
    directoryName,
    rawFile: { filename: fileName, buffer: Buffer.from(csvString).toString('base64') },
  });

  const url = await unchainedAPI.services.files.createFileDownloadURL({
    file: uploaded,
    expires: 3600000,
  });
  return url;
};

export default generateCSVFileAndURL;
