[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-users.svg)](https://npmjs.com/package/@unchainedshop/core-users)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-users

User management module for the Unchained Engine. Handles user accounts, authentication, profiles, and WebAuthn support.

## Installation

```bash
npm install @unchainedshop/core-users
```

## Usage

```typescript
import { configureUsersModule } from '@unchainedshop/core-users';

const usersModule = await configureUsersModule({ db, migrationRepository });

// Find users
const users = await usersModule.findUsers({
  includeGuests: false,
  limit: 50,
});

// Create a user
const userId = await usersModule.createUser({
  email: 'user@example.com',
  password: 'securePassword',
});

// Update profile
await usersModule.updateProfile(userId, {
  profile: { displayName: 'John Doe' },
});
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureUsersModule` | Configure and return the users module |
| `configureUsersWebAuthnModule` | Configure WebAuthn submodule |

### Queries

| Method | Description |
|--------|-------------|
| `findUser` | Find user by ID, email, or username |
| `findUsers` | Find users with filtering, sorting, and pagination |
| `count` | Count users matching query |
| `userExists` | Check if a user exists |

### Mutations

| Method | Description |
|--------|-------------|
| `createUser` | Create a new user account |
| `updateUser` | Update user data |
| `updateProfile` | Update user profile |
| `updateRoles` | Update user roles |
| `updateTags` | Update user tags |
| `updateAvatar` | Set user avatar |
| `updateLastBillingAddress` | Update billing address |
| `setPassword` | Change user password |
| `setUsername` | Change username |
| `markDeleted` | Soft delete and anonymize a user |
| `deletePermanently` | Permanently delete a user document |

### Authentication

| Method | Description |
|--------|-------------|
| `verifyPassword` | Verify password against stored hash |
| `hashPassword` | Hash a password for storage |
| `addEmail` | Add email address to user |
| `removeEmail` | Remove email address |
| `verifyEmail` | Mark email as verified |
| `updateHeartbeat` | Update last activity timestamp |

### WebAuthn Submodule

| Method | Description |
|--------|-------------|
| `webAuthn.createCredentialCreationOptions` | Create registration options |
| `webAuthn.createCredentialRequestOptions` | Create authentication options |
| `webAuthn.verifyCredentialCreation` | Verify registration response |
| `webAuthn.verifyCredentialRequest` | Verify authentication response |
| `addWebAuthnCredential` | Store a verified user credential |
| `removeWebAuthnCredential` | Remove a user credential |

### Settings

| Export | Description |
|--------|-------------|
| `userSettings` | Access user module settings |
| `UserAccountAction` | Account action types enum |

### Types

| Export | Description |
|--------|-------------|
| `User` | User document type |
| `UserQuery` | Query parameters type |
| `UserProfile` | User profile type |
| `Email` | Email address type |
| `UsersModule` | Module interface type |
| `UserSettingsOptions` | Configuration options type |

## Events

| Event | Description |
|-------|-------------|
| `USER_CREATE` | User created |
| `USER_UPDATE` | User updated |
| `USER_REMOVE` | User deleted |
| `USER_UPDATE_PROFILE` | Profile updated |
| `USER_UPDATE_PASSWORD` | Password changed |
| `USER_ACCOUNT_ACTION` | Account action triggered |

## Security

This module implements security best practices for user authentication and data protection.

### Password Security

- **Algorithm**: New hashes use PBKDF2 with SHA-512; verification also accepts legacy bcrypt hashes
- **Iterations**: 300,000
- **Salt**: 16 bytes, cryptographically random per password
- **Key Length**: 256 bits (32 bytes)
- See [SECURITY.md](../../SECURITY.md) for deployment-specific cryptography considerations

### Token Security

- **Generation**: `crypto.randomUUID()` (CSPRNG-based)
- **Storage**: SHA-256 hashed before database storage
- **Expiration**: Reset and verification tokens default to one hour; customize `userSettings.earliestValidTokenDate` by account action
- **Single-use**: Password-reset and email-verification tokens are consumed when used; access tokens are reusable

### WebAuthn/FIDO2

Full support for passwordless authentication via hardware security keys and platform authenticators, providing phishing-resistant authentication.

### Data Protection

- Sensitive data (password hashes, tokens) stripped from event emissions via `removeConfidentialServiceHashes()`
- Soft delete preserves audit trail while removing PII
- Email addresses and profile data access-controlled via RBAC

See [SECURITY.md](../../SECURITY.md) for complete security documentation.

## License

EUPL-1.2
