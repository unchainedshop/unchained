[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-files.svg)](https://npmjs.com/package/@unchainedshop/core-files)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-files

File management module for the Unchained Engine. Handles media file metadata storage and URL normalization.

## Installation

```bash
npm install @unchainedshop/core-files
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.files`.

```typescript
const { files } = platform.unchainedAPI.modules;

const file = await files.findFile({ fileId: 'file-123' });
if (file?.url) {
  const url = files.normalizeUrl(file.url, { version: 'small' });
}
```

This module manages file metadata and URL transformation. File adapters and `unchainedAPI.services.files` handle uploads, downloads, and storage operations. Configure `options.files.transformUrl` and `options.files.privateFileSharingMaxAge` when starting the platform.

See the [file upload guide](https://docs.unchained.shop/guides/file-uploads), [module settings](https://docs.unchained.shop/platform-configuration/modules/files), [public exports](src/files-index.ts), and [module implementation](src/module/configureFilesModule.ts).

## License

EUPL-1.2
