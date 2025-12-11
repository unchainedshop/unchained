---
sidebar_position: 11
sidebar_label: Users
title: Users Module
description: User management, authentication, and profile configuration
---

# Users Module

The users module handles user authentication, registration, profiles, and account management.

## Configuration Options

```typescript
export interface UserSettingsOptions {
  mergeUserCartsOnLogin?: boolean;
  autoMessagingAfterUserCreation?: boolean;
  earliestValidTokenDate?: (
    type: UserAccountAction.VERIFY_EMAIL | UserAccountAction.RESET_PASSWORD,
  ) => Date;
  validateEmail?: (email: string) => Promise<boolean>;
  validateUsername?: (username: string) => Promise<boolean>;
  validateNewUser?: (user: UserRegistrationData) => Promise<UserRegistrationData>;
  validatePassword?: (password: string) => Promise<boolean>;
}
```

### User Cart Merging

Assuming somebody starts his journey in your web shop with a guest user and you want to provide a late "login", enabling `mergeUserCartsOnLogin` will migrate the guest cart to the logged in user's cart. (default: enabled)

### Auto Messaging After User Creation

If Auto Messaging is turned on and E-Mail is provided during registration, Unchained will (default: disabled):
1. Send an E-Mail Verification Link to users that registered with a password
2. Send Set-Password Link to users that registered without a password

The token in the link allows auto sign-in once the password is set or the E-mail address is verified.

### Token Invalidation

When sending reset-password or e-mail verification links, tokens are generated.
To control how long those tokens are valid, you can customize `earliestValidTokenDate`. For example if you want the tokens to be valid for 30 days (default: 1 hour):

```typescript
const options = {
  modules: {
    users: {
      earliestValidTokenDate: () => {
        return new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30);
      },
    },
  },
};
```

Changing this will affect newly created tokens and older tokens so you can safely play with it, you could even set it to 10 years and later reduce.

### Validate User Data on Registration

Unchained provides different hooks to validate user registration data, here is an example to restrict registration to an e-mail address suffix:

```typescript
const options = {
  modules: {
    users: {
      validateEmail: (emailAddress) => {
        return emailAddress.endsWith("@unchained.shop");
      },
    },
  },
};
```

By default, Unchained does the following:

1. Allow every password as long as it's minimum 8 chars
2. Allow every username as long as it's minimum 3 chars and does not exist in the db already
3. Allow every e-mail that has an `@` and does not exist in the db already
4. Sanitize the user data in `validateNewUser` to: lowercase e-mail, lowercase username.

:::warning
Security Advice: If you use a 3rd party identity provider for example Zitadel, Microsoft Entra or Keycloak, you should probably disable registration by throwing an error in `validateNewUser` and disable changing username/e-mail on unchained users by returning false in the validate* functions.
:::

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `USER_CREATE` | `{ user }` | Emitted when a user is created |
| `USER_UPDATE` | `{ userId }` | Emitted when a user is updated |
| `USER_REMOVE` | `{ userId }` | Emitted when a user is removed |
| `USER_ACCOUNT_ACTION` | `{ action, userId }` | Emitted for account actions (verify email, reset password) |
| `USER_ADD_ROLES` | `{ userId, roles }` | Emitted when roles are added to a user |
| `USER_UPDATE_USERNAME` | `{ userId }` | Emitted when username is updated |
| `USER_UPDATE_PASSWORD` | `{ userId }` | Emitted when password is updated |
| `USER_UPDATE_AVATAR` | `{ userId }` | Emitted when avatar is updated |
| `USER_UPDATE_GUEST` | `{ userId }` | Emitted when guest status changes |
| `USER_UPDATE_HEARTBEAT` | `{ userId }` | Emitted on user heartbeat |
| `USER_UPDATE_PROFILE` | `{ userId }` | Emitted when profile is updated |
| `USER_UPDATE_BILLING_ADDRESS` | `{ userId }` | Emitted when billing address is updated |
| `USER_UPDATE_LAST_CONTACT` | `{ userId }` | Emitted when last contact is updated |
| `USER_UPDATE_ROLE` | `{ userId }` | Emitted when role is updated |
| `USER_UPDATE_TAGS` | `{ userId }` | Emitted when tags are updated |

## More Information

For API usage and detailed documentation, see the [core-users package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-users).
