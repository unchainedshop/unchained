---
sidebar_position: 6
title: Authentication
sidebar_label: Authentication
description: Understanding authentication patterns in Unchained Engine
---

# Authentication

Unchained Engine uses stateless JWT sessions. On login, the engine signs an HS256 JWT and delivers it as an HTTP-only cookie — the token never appears in the GraphQL response. Machine clients authenticate through the `Authorization` header with an opaque access token or an OIDC bearer token.

| Strategy | Use Case | Entry Point |
|----------|----------|-------------|
| Guest | Anonymous cart & checkout | `loginAsGuest` |
| Email/Password | Traditional registration | `createUser`, `loginWithPassword` |
| WebAuthn | Passkeys, biometrics, security keys | `loginWithWebAuthn` |
| OIDC | External identity providers | `authConfig.oidcProviders` + bearer token |
| Access Token | Machine-to-machine | `modules.users.createAccessToken` |

## Session Tokens

On every successful login (`loginWithPassword`, `loginAsGuest`, `createUser`, `loginWithWebAuthn`, `resetPassword`, `verifyEmail`, `impersonate`), the engine:

1. Signs a JWT (HS256, via [jose](https://github.com/panva/jose)) with `sub` (user ID), `ver` (token version), `jti`, and `iss` claims.
2. Sets it as an HTTP-only cookie (`unchained_token` by default).
3. Sets a second hardened fingerprint cookie (`__Secure-fgp` by default, always `SameSite=Strict`) with a random value whose SHA-256 hash is embedded in the JWT as the `fgp` claim. Requests are only authenticated when cookie and claim match — a stolen JWT is useless without the fingerprint cookie (OWASP token-sidejacking protection).

The mutation response only exposes the expiry, not the token:

```graphql
mutation Login {
  loginWithPassword(email: "user@example.com", password: "securepassword") {
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

Send subsequent requests with cookies included (`credentials: 'include'` with `fetch`).

### Configuration

| Environment Variable | Default | Description |
|----------------------|---------|-------------|
| `UNCHAINED_TOKEN_SECRET` | — (required) | HS256 signing secret, minimum 32 characters |
| `UNCHAINED_TOKEN_EXPIRY_SECONDS` | `3600` | JWT and cookie lifetime |
| `UNCHAINED_TOKEN_ISSUER` | `unchained-engine` | `iss` claim, validated on verification |
| `UNCHAINED_COOKIE_NAME` | `unchained_token` | JWT cookie name |
| `UNCHAINED_COOKIE_PATH` | `/` | Cookie path |
| `UNCHAINED_COOKIE_DOMAIN` | — | Cookie domain |
| `UNCHAINED_COOKIE_SAMESITE` | `lax` | `strict`, `lax`, `none`, `1` (true) or `0` (false) |
| `UNCHAINED_COOKIE_INSECURE` | — | Set to drop the `Secure` flag (development only) |
| `UNCHAINED_FINGERPRINT_COOKIE_NAME` | `__Secure-fgp` | Fingerprint cookie name |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

For local storefront development against a remote engine, the server adapters accept a dev-only escape hatch (it throws if `NODE_ENV=production`):

```typescript
connect(fastify, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
});
```

### Logout

`logout` clears both cookies, but the JWT itself stays cryptographically valid until it expires. `logoutAllSessions` increments the user's server-side token version, immediately invalidating every JWT ever issued to that user:

```graphql
mutation {
  logout {
    success
  }
}
```

```graphql
mutation {
  logoutAllSessions {
    success
  }
}
```

## Guest Users

| Type | Can Browse | Can Add to Cart | Can Checkout |
|------|-----------|-----------------|--------------|
| Anonymous | Yes | No | No |
| Guest | Yes | Yes | Yes |
| Registered | Yes | Yes | Yes |

Anonymous visitors can browse products and assortments without any session. State-changing operations (cart, checkout) require at least a guest session:

```graphql
mutation LoginAsGuest {
  loginAsGuest {
    _id
    tokenExpires
  }
}
```

`loginAsGuest` creates an anonymous user (flagged `guest: true`) and logs it in like any other user. From there, `addCartProduct` and `checkoutCart` work normally — the cart itself is created on the first cart mutation.

Note that `createUser` always creates a fresh account: registering during a guest session does not carry the guest's cart or order history over to the new account.

## Email/Password

### Registration

```graphql
mutation CreateUser {
  createUser(
    email: "user@example.com"
    password: "securepassword"
    profile: { displayName: "John Doe" }
  ) {
    _id
    tokenExpires
    user {
      _id
    }
  }
}
```

Either `username` or `email` is required, plus either `password` or `webAuthnPublicKeyCredentials`. The very first user created on an empty system automatically gets the `admin` role.

### Login

```graphql
mutation Login {
  loginWithPassword(email: "user@example.com", password: "securepassword") {
    _id
    tokenExpires
  }
}
```

### Password Reset

```graphql
mutation {
  forgotPassword(email: "user@example.com") {
    success
  }
}
```

```graphql
mutation {
  resetPassword(token: "reset-token-from-email", newPassword: "newpassword") {
    _id
    tokenExpires
  }
}
```

### Change Password

```graphql
mutation {
  changePassword(oldPassword: "currentpassword", newPassword: "newpassword") {
    success
  }
}
```

## WebAuthn (Passwordless)

The relying party ID and origin are derived from `ROOT_URL` (default `http://localhost:4010`); the display name comes from `EMAIL_WEBSITE_NAME` (default `Unchained`).

### Registration Flow

1. Get creation options (returns JSON with challenge, rp, user, pubKeyCredParams):

```graphql
mutation {
  createWebAuthnCredentialCreationOptions(username: "user@example.com")
}
```

2. Create the credential with the browser WebAuthn API:

```javascript
const credential = await navigator.credentials.create({
  publicKey: creationOptions,
});
```

3. Store it:

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

### Login Flow

1. Get request options:

```graphql
mutation {
  createWebAuthnCredentialRequestOptions(username: "user@example.com")
}
```

2. Authenticate with the browser WebAuthn API:

```javascript
const credential = await navigator.credentials.get({
  publicKey: requestOptions,
});
```

3. Verify and log in:

```graphql
mutation LoginWithWebAuthn($credentials: JSON!) {
  loginWithWebAuthn(webAuthnPublicKeyCredentials: $credentials) {
    _id
    tokenExpires
  }
}
```

## OIDC (External Identity Providers)

Register trusted providers when connecting the server adapter. Bearer JWTs issued by those providers are then verified against the provider's JWKS (issuer and optional audience validation) and mapped to a user:

```typescript
import { connect } from '@unchainedshop/api/lib/fastify/index.js';

connect(fastify, platform, {
  authConfig: {
    oidcProviders: [
      {
        issuer: 'https://auth.example.com',
        // optional, defaults to `${issuer}/.well-known/jwks.json`
        jwksUri: 'https://auth.example.com/.well-known/jwks.json',
        // optional audience validation
        audience: 'my-client-id',
      },
    ],
  },
});
```

When `oidcProviders` is configured, an OIDC back-channel logout route is mounted automatically.

The browser-facing login flow (authorization redirect, code exchange, user provisioning) is implemented with custom resolvers via `startPlatform`'s `context` parameter. See the [OIDC example](https://github.com/unchainedshop/unchained/tree/master/examples/oidc) for complete Keycloak and Zitadel setups.

## Access Tokens (Machine-to-Machine)

For server-to-server access, create an opaque access token programmatically (for example in your boot script):

```typescript
const result = await platform.unchainedAPI.modules.users.createAccessToken('admin');
if (result) {
  console.log(result.token); // only available at creation time
}
```

Only the SHA-256 hash of the token is stored (`services.token.secret`). Use it as a bearer token:

```http
Authorization: Bearer <token>
```

A user has at most one access token; calling `createAccessToken` again replaces it.

:::note
`me { tokens }` and the `invalidateToken` mutation in the GraphQL API refer to tokenized products (warehousing/NFT domain), not authentication tokens.
:::

## Impersonation

Users with the `admin` role can impersonate non-admin users (impersonating another admin is rejected):

```graphql
mutation {
  impersonate(userId: "user-id") {
    _id
    user {
      _id
    }
  }
}
```

While impersonating, `impersonator { _id }` returns the acting admin. End the impersonation and resume the admin session with:

```graphql
mutation {
  stopImpersonation {
    _id
    user {
      _id
    }
  }
}
```

## Cryptography

| Operation | Algorithm |
|-----------|-----------|
| Password hashing | PBKDF2-SHA512, 300,000 iterations, 16-byte random salt |
| Session tokens | HS256 JWT (jose) + SHA-256 fingerprint cookie |
| Access token storage | SHA-256 hash of a CSPRNG-generated token |

Enforce a custom password policy through the users module options:

```typescript
await startPlatform({
  options: {
    users: {
      validatePassword: async (password) => password.length >= 12,
    },
  },
});
```

## Related

- [Permissions Reference](./permissions.md) - Roles, permission actions, and custom roles
- [Security Guide](../deployment/security) - Security features and compliance
- [Users Module](../platform-configuration/modules/users.md) - User configuration options
- [Admin UI](../admin-ui/overview.md) - Admin UI overview
