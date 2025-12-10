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

const usersModule = await configureUsersModule({ db });

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
  displayName: 'John Doe',
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
| `updateBillingAddress` | Update billing address |
| `updatePassword` | Change user password |
| `updateUsername` | Change username |
| `delete` | Soft delete a user |
| `replaceUserId` | Migrate data between users |

### Authentication

| Method | Description |
|--------|-------------|
| `verifyPassword` | Verify password against stored hash |
| `hashPassword` | Hash a password for storage |
| `addEmail` | Add email address to user |
| `removeEmail` | Remove email address |
| `verifyEmail` | Mark email as verified |
| `updateHeartbeat` | Update last activity timestamp |
| `updateLastLogin` | Record login event |

### WebAuthn Submodule

| Method | Description |
|--------|-------------|
| `webAuthn.findCredentials` | Find WebAuthn credentials for user |
| `webAuthn.createCredential` | Register new WebAuthn credential |
| `webAuthn.removeCredential` | Remove WebAuthn credential |

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
| `USER_UPDATE_ROLES` | Roles changed |
| `USER_ACCOUNT_ACTION` | Account action triggered |

## License

EUPL-1.2
