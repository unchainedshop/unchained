export type ACPErrorType = 'invalid_request' | 'processing_error' | 'service_unavailable';

interface ACPErrorOptions {
  param?: string;
  supportedVersions?: string[];
  headers?: Record<string, string>;
}

export class ACPError extends Error {
  readonly status: number;
  readonly type: ACPErrorType;
  readonly code: string;
  readonly options: ACPErrorOptions;

  constructor(
    status: number,
    type: ACPErrorType,
    code: string,
    message: string,
    options: ACPErrorOptions = {},
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
}
