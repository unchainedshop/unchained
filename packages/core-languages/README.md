[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-languages.svg)](https://npmjs.com/package/@unchainedshop/core-languages)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-languages

Language management module for the Unchained Engine. Manages supported languages with ISO codes for multi-language content.

## Installation

```bash
npm install @unchainedshop/core-languages
```

## Usage

```typescript
import { configureLanguagesModule } from '@unchainedshop/core-languages';

const languagesModule = await configureLanguagesModule({ db });

// Create a language
const languageId = await languagesModule.create({
  isoCode: 'en',
});

// Find languages
const languages = await languagesModule.findLanguages({ includeInactive: false });

// Check if language is base language
const isBase = languagesModule.isBase(language);
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureLanguagesModule` | Configure and return the languages module |

### Queries

| Method | Description |
|--------|-------------|
| `findLanguage` | Find language by ID or ISO code |
| `findLanguages` | Find languages with filtering, sorting, and pagination |
| `count` | Count languages matching query |
| `languageExists` | Check if a language exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new language |
| `update` | Update an existing language |
| `delete` | Soft delete a language |

### Helper Methods

| Method | Description |
|--------|-------------|
| `isBase` | Check if language is the base/system language |

### Types

| Export | Description |
|--------|-------------|
| `Language` | Language document type |
| `LanguageQuery` | Query parameters type |
| `LanguagesModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `LANGUAGE_CREATE` | Emitted when a language is created |
| `LANGUAGE_UPDATE` | Emitted when a language is updated |
| `LANGUAGE_REMOVE` | Emitted when a language is removed |

## License

EUPL-1.2
