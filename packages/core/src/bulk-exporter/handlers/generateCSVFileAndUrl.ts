import type { UnchainedCore } from '../../core-index.ts';
import toCSV from './toCSV.ts';

export interface CSVFileResult {
  url: string;
  expires: number;
}

const generateCSVFileAndURL = async (
  {
    rows,
    headers,
    directoryName,
    fileName,
    unchainedAPI,
  }: {
    rows: Record<string, unknown>[];
    headers: string[];
    directoryName: string;
    fileName: string;
    unchainedAPI: UnchainedCore;
  },
  expires = 3600000,
): Promise<CSVFileResult> => {
  const csvString = toCSV(headers, rows);

  const uploaded = await unchainedAPI.services.files.uploadFileFromStream({
    directoryName,
    rawFile: { filename: fileName, buffer: Buffer.from(csvString).toString('base64') },
    meta: { isPrivate: true },
  });
  const expiresAt = Date.now() + expires;
  const url = await unchainedAPI.services.files.createFileDownloadURL({
    file: uploaded,
    expires: expiresAt,
  });

  if (!url) {
    throw new Error(`Failed to generate download URL for ${fileName}`);
  }

  return { url, expires: expiresAt };
};

export default generateCSVFileAndURL;
