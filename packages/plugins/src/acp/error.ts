import { ACP_API_VERSION } from './config.ts';

export type ACPErrorType = 'invalid_request' | 'processing_error' | 'service_unavailable';

export class ACPError extends Error {
  readonly status: number;
  readonly type: ACPErrorType;
  readonly code: string;
  readonly options: {
    param?: string;
    supportedVersions?: string[];
    headers?: Record<string, string>;
  };

  constructor(
    status: number,
    type: ACPErrorType,
    code: string,
    message: string,
    options: {
      param?: string;
      supportedVersions?: string[];
      headers?: Record<string, string>;
    } = {},
  ) {
    super(message);
    this.status = status;
    this.type = type;
    this.code = code;
    this.options = options;
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      ...(this.options.param ? { param: this.options.param } : {}),
      ...(this.options.supportedVersions ? { supported_versions: this.options.supportedVersions } : {}),
    };
  }

  static unsupportedVersion(message: string) {
    return new ACPError(400, 'invalid_request', 'unsupported_api_version', message, {
      param: '$.headers.API-Version',
      supportedVersions: [ACP_API_VERSION],
    });
  }
}
