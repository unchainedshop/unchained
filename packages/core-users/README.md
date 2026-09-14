[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-users.svg)](https://npmjs.com/package/@unchainedshop/core-users)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-users

User management module for the Unchained Engine. Handles user accounts, authentication, profiles, and WebAuthn support.

## Installation

```bash
npm install @unchainedshop/core-users
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.users`.

```typescript
const { users } = platform.unchainedAPI.modules;
const customers = await users.findUsers({ includeGuests: false, limit: 50 });

await users.updateProfile('user-123', {
  profile: { displayName: 'Jane Doe' },
});
```

`updateProfile` accepts an object containing `profile` and optional `meta`. Account creation uses `createUser`; account deletion uses `markDeleted` or `deletePermanently`. Authentication flows and permissions are coordinated by the API layer.

See the [module settings](https://docs.unchained.shop/platform-configuration/modules/users), [authentication guide](https://docs.unchained.shop/concepts/authentication), [public exports](src/users-index.ts), and [module implementation](src/module/configureUsersModule.ts).

For security reporting and the implementation's security properties, see [SECURITY.md](../../SECURITY.md).

## License

EUPL-1.2
