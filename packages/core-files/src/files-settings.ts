export interface FilesSettingsOptions {
  transformUrl?: (url: string, params: Record<string, any>) => string;
}

export interface FilesSettings {
  transformUrl?: (url: string, params: Record<string, any>) => string;
  configureSettings: (options?: FilesSettingsOptions) => void;
}

export const defaultTransformUrl = (url) => url;

export const filesSettings: FilesSettings = {
  transformUrl: null,
  configureSettings: async ({ transformUrl }) => {
    filesSettings.transformUrl = transformUrl || defaultTransformUrl;
  },
};
