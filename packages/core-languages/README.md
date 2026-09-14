[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-languages.svg)](https://npmjs.com/package/@unchainedshop/core-languages)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-languages

Language management module for the Unchained Engine. Manages supported languages with ISO codes for multi-language content.

## Installation

```bash
npm install @unchainedshop/core-languages
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.languages`.

```typescript
const { languages } = platform.unchainedAPI.modules;

const languageId = await languages.create({ isoCode: 'en', isActive: true });
const language = await languages.findLanguage({ languageId });
const activeLanguages = await languages.findLanguages({ includeInactive: false });
```

`create` returns a language ID. Product and assortment translations are managed by their respective modules.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/languages), [public exports](src/languages-index.ts), and [module implementation](src/module/configureLanguagesModule.ts).

## License

EUPL-1.2
