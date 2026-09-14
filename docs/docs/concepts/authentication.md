---
sidebar_position: 6
title: Authentication
sidebar_label: Authentication
description: Understanding authentication patterns in Unchained Engine
---

# Authentication

Unchained Engine supports multiple authentication patterns to accommodate different user flows and integration requirements.

## Authentication Strategies

| Strategy | Use Case |
|----------|----------|
| **Guest** | Anonymous browsing and checkout |
| **Email/Password** | Traditional user registration |
| **WebAuthn** | Passwordless authentication |
| **OIDC** | External identity providers (Google, Keycloak, etc.) |
| **API Token** | Machine-to-machine authentication |

## Anonymous vs Guest Users

Unchained distinguishes between anonymous visitors and guest users:

| Type | Can Browse | Can Add to Cart | Can Checkout |
|------|-----------|-----------------|--------------|
| **Anonymous** | Yes | No | No |
| **Guest** | Yes | Yes | Yes |
| **Registered** | Yes | Yes | Yes |

Anonymous users can browse products and assortments without authentication. To perform state-changing operations (cart, checkout), a guest or registered user session is required.

### Flow

```mermaid
flowchart TD
    subgraph Anonymous["Anonymous Visitor"]
        B1[Browse Products]
        B1 -->|Add to Cart?| AUTH[Requires Auth]
    end

    AUTH --> LG[loginAsGuest]

    LG --> Guest

    subgraph Guest["Guest User"]
        B2[Browse]
        C[Add to Cart]
        CO[Checkout]
        REG[Register? - Optional]
        B2 --> C --> CO --> REG
    end
```

### Implementation

```graphql
mutation LoginAsGuest {
  loginAsGuest {
    _id
    tokenExpires
  }
}
```

The session token is set as an HTTP-only cookie automatically. For subsequent requests, ensure cookies are sent with your requests.

```graphql
mutation AddToCart {
  addCartProduct(productId: "...", quantity: 1) {
    _id
  }
}
```

```graphql
mutation Checkout {
  checkoutCart {
    _id
    orderNumber
  }
}
```

### Guest to Registered Conversion

Guests can register without losing their cart or order history:

```graphql
mutation CreateUser {
  createUser(
    email: "user@example.com"
    password: "securepassword"
  ) {
    _id
    tokenExpires
  }
}
```

The new account inherits:
- Current cart
- Order history
- Bookmarks
- Preferences

## Email/Password Authentication

Traditional authentication with email and password.

### Registration

```graphql
mutation CreateUserWithProfile {
  createUser(
    email: "user@example.com"
    password: "securepassword"
    profile: {
      displayName: "John Doe"
    }
  ) {
    _id
    tokenExpires
    user {
      _id
      primaryEmail {
        address
      }
      profile {
        displayName
      }
    }
  }
}
```

### Login

```graphql
mutation Login {
  loginWithPassword(
    email: "user@example.com"
    password: "securepassword"
  ) {
    _id
    tokenExpires
    user {
      _id
      primaryEmail {
        address
      }
    }
  }
}
```

### Password Reset

```graphql
mutation ForgotPassword {
  forgotPassword(email: "user@example.com") {
    success
  }
}
```

Reset with token (from email):

```graphql
mutation ResetPassword {
  resetPassword(
    token: "reset-token-from-email"
    newPassword: "newpassword"
  ) {
    _id
    tokenExpires
  }
}
```

### Change Password

```graphql
mutation {
  changePassword(
    oldPassword: "currentpassword"
    newPassword: "newpassword"
  ) {
    success
  }
}
```

## WebAuthn (Passwordless)

Unchained Engine supports WebAuthn for passwordless authentication using biometrics or security keys.

### Registration Flow

1. Get registration options (returns JSON with challenge, rp, user, pubKeyCredParams, etc.):

```graphql
mutation GetCredentialCreationOptions {
  createWebAuthnCredentialCreationOptions(username: "user@example.com")
}
```

2. Convert the JSON challenge and user ID to binary values before calling the browser API. The following call assumes `creationOptions` is already a `PublicKeyCredentialCreationOptions` object:

```javascript
const credential = await navigator.credentials.create({
  publicKey: creationOptions
});
```

3. Serialize credential binary fields as base64url strings and store the credential:

```graphql
mutation AddWebAuthnCredentials($credentials: JSON!) {
  addWebAuthnCredentials(credentials: $credentials) {
    _id
    webAuthnCredentials {
      _id
    }
  }
}
```

### Authentication Flow

1. Get authentication options (returns JSON with challenge, rpId, allowCredentials, etc.):

```graphql
mutation GetCredentialRequestOptions {
  createWebAuthnCredentialRequestOptions(username: "user@example.com")
}
```

2. Convert the JSON challenge and allowed credential IDs to binary values. The following call assumes `requestOptions` is already a `PublicKeyCredentialRequestOptions` object:

```javascript
const credential = await navigator.credentials.get({
  publicKey: requestOptions
});
```

3. Serialize the assertion binary fields as base64url strings, include the returned request ID, and verify the login:

```graphql
mutation LoginWithWebAuthn($credentials: JSON!) {
  loginWithWebAuthn(webAuthnPublicKeyCredentials: $credentials) {
    _id
    tokenExpires
    user {
      _id
    }
  }
}
```

## OIDC (External Identity Providers)

Integrate with external identity providers using OpenID Connect.

### Supported Providers

Any OIDC-compliant provider:
- Google
- Apple
- Keycloak
- Zitadel
- Auth0
- Azure AD
- Custom providers

### Configuration

OIDC integration is configured through the GraphQL context. See the [OIDC Example](https://github.com/unchainedshop/unchained/tree/master/examples/oidc) for a complete implementation using `startPlatform`'s `context` parameter to add custom authentication logic.

### Login Flow

The OIDC example uses HTTP routes and a custom context resolver:

1. `/login` redirects the browser to the configured provider.
2. The provider redirects to `/login/keycloak/callback` or `/login/zitadel/callback`.
3. The callback exchanges the code and stores provider tokens in the server-side session.
4. The context resolver maps the provider identity and roles to an Unchained user.

The example selects Zitadel or Keycloak from its environment variables; additional providers require an equivalent integration.

## API Token Authentication

For server-to-server or automated access.

### Creating and Rotating an Access Token

Create a token from trusted server code for an existing username:

```typescript
const result = await modules.users.createAccessToken('integration-user');
if (!result) throw new Error('User not found');
const accessToken = result.token;
```

Store the returned token securely. The user's `services.token` field contains its SHA-256 hash, and issuing another access token replaces the previous one. The GraphQL `User.tokens` field and `invalidateToken` mutation concern tokenized products; they do not manage API authentication credentials.

### Including Token in Requests

```http
Authorization: Bearer <access-token>
```

The standard API adapters resolve this bearer token through the user module. Browser login uses the separate cookie-backed session described below.

## Session Management

### Token Format

The standard Express and Fastify adapters use signed session-ID cookies and MongoDB-backed sessions. Login mutations return a session ID and expiry; they do not issue JWTs. `UNCHAINED_TOKEN_SECRET` signs session cookies:

```bash
UNCHAINED_TOKEN_SECRET=your-32-character-minimum-secret-here
```

### Logout

```graphql
mutation {
  logout {
    success
  }
}
```

### Current User

```graphql
query CurrentUser {
  me {
    _id
    primaryEmail {
      address
    }
    username
    profile {
      displayName
      address {
        firstName
        lastName
        company
        city
        postalCode
        countryCode
      }
    }
    roles
    cart {
      _id
    }
  }
}
```

## Role-Based Access Control

Unchained uses RBAC for authorization:

### Built-in Roles

| Role | Description |
|------|-------------|
| `admin` | Full access to all operations |
| `__loggedIn__` | Automatically included for authenticated users |
| `__all__` | Automatically included for every request |

### Checking Permissions

```typescript
import { Roles } from '@unchainedshop/roles';

if (!(await Roles.userHasPermission(context, 'manageOrders', []))) {
  throw new Error('Permission denied');
}
```

### Custom Roles

`Role` registers itself during construction. Define it after platform initialization has configured the built-in roles, or use `rolesOptions.additionalRoles` at startup.

```typescript
import { Role } from '@unchainedshop/roles';

const supportRole = new Role('support');
supportRole.allow('viewOrders', async () => true);

await modules.users.updateRoles(userId, ['support']);
```

Permission callbacks receive `(root, parameters, context)`. Use an existing action name from the API or register your custom action before checking it.

## Security Best Practices

For comprehensive security documentation, see the [Security Guide](../deployment/security).

### Cryptographic Standards

Unchained uses industry-standard cryptography for authentication:

| Operation | Algorithm | Details |
|-----------|-----------|---------|
| Password Hashing | PBKDF2-SHA512 | 300,000 iterations, 16-byte salt |
| Token Storage | SHA-256 | Tokens hashed before database storage |
| Token Generation | CSPRNG | `crypto.randomUUID()` |
| Session Cookies | HMAC signatures | Integrity protection for session IDs; session data is stored in MongoDB without application-level encryption by the default adapters |

### 1. Token Secret

Use a strong, unique secret:

```bash
UNCHAINED_TOKEN_SECRET=your-32-character-minimum-secret-here
```

### 2. HTTPS Only

Always use HTTPS in production. When connecting Unchained to your web server framework, configure secure cookies:

```typescript
// When using Fastify
connect(fastify, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
});
```

### 3. Rate Limiting

Implement rate limiting for authentication endpoints:

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts',
});

app.use('/graphql', authLimiter);
```

### 4. Password Requirements

Configure password validation through the users module options:

```typescript
await startPlatform({
  options: {
    users: {
      validatePassword: async (password: string) => {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
          throw new Error('Password must contain an uppercase letter');
        }
        if (!/[0-9]/.test(password)) {
          throw new Error('Password must contain a number');
        }
        return true;
      },
    },
  },
});
```

## Related

- [Security Guide](../deployment/security) - Security features and compliance
- [Users Module](../platform-configuration/modules/users.md) - User configuration options
- [Admin UI](../admin-ui/overview.md) - Admin UI overview
