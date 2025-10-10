export interface FilesSettings {
  transformUrl: (url: string, params: Record<string, any>) => string;
  privateFileSharingMaxAge: number;
  configureSettings: (options: FilesSettingsOptions) => void;
}

export type FilesSettingsOptions = Omit<Partial<FilesSettings>, 'configureSettings'>;

export const defaultTransformUrl = (url) => url;
export const PRIVATE_FILE_SHARING_MAX_AGE = 86400000; // 24 hours in milliseconds

export const filesSettings: FilesSettings = {
  transformUrl: defaultTransformUrl,
  privateFileSharingMaxAge: PRIVATE_FILE_SHARING_MAX_AGE,
  configureSettings: ({ transformUrl, privateFileSharingMaxAge } = {}) => {
    filesSettings.transformUrl = transformUrl || defaultTransformUrl;
    filesSettings.privateFileSharingMaxAge = privateFileSharingMaxAge || PRIVATE_FILE_SHARING_MAX_AGE;
  },
};
