export interface FilesSettingsOptions {
  transformUrl?: (url: string, params: Record<string, any>) => string;
  privateFileSharingMaxAge?: number;
}

export interface FilesSettings {
  transformUrl?: (url: string, params: Record<string, any>) => string;
  configureSettings: (options?: FilesSettingsOptions) => void;
  privateFileSharingMaxAge?: number;
}

export const defaultTransformUrl = (url) => url;

export const filesSettings: FilesSettings = {
  transformUrl: null,
  privateFileSharingMaxAge: null,
  configureSettings: async ({ transformUrl, privateFileSharingMaxAge }) => {
    filesSettings.transformUrl = transformUrl || defaultTransformUrl;
    filesSettings.privateFileSharingMaxAge = privateFileSharingMaxAge;
  },
};
