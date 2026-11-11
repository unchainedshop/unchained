---
sidebar_position: 6.5
title: Login Codes
sidebar_label: Login Codes
description: Opt-in passwordless login with a link and a one-time code sent by mail
---

# Login Codes

Login codes are a passwordless login by mail and are **disabled by default**. `requestLoginCode(email)` mails a link and a short numeric code to the address. `loginWithLoginCode` logs the user in with the token of the link, or with the address and the code. Either one uses up the mail.

```typescript
await startPlatform({
  options: {
    users: {
      loginCode: { enabled: true, sessionExpiresInSeconds: 12 * 60 * 60 },
    },
  },
});
```

The `LOGIN_CODE` worker of the base preset sends the mail, so a worker has to run.

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `false` | While disabled, `requestLoginCode` queues nothing and `loginWithLoginCode` fails with `InvalidCredentials`, also for codes mailed before |
| `expiresInMinutes` | `15` | How long the link and the code stay valid |
| `maxAttempts` | `5` | Code attempts per mail, after that the link and the code are void |
| `codeLength` | `6` | Digits of the code |
| `maxChallengesPerWindow` | `5` | Mails per address and per user within `challengeWindowMinutes` |
| `challengeWindowMinutes` | `60` | Window of `maxChallengesPerWindow` |
| `sessionExpiresInSeconds` | `UNCHAINED_TOKEN_EXPIRY_SECONDS` | Session length of a code login, see [Session Length per Login](./authentication.md#session-length-per-login) |

## Flow

1. `requestLoginCode(email)` always returns `true` and only queues a `LOGIN_CODE` work, so neither the answer nor its timing tells whether the address belongs to a user.
2. The worker looks the user up by the address and creates a challenge, which voids the open challenges of the user and of the address. `modules.users.loginCode` then emits `USER_ACCOUNT_ACTION` with the action `login-code`, which queues the `ACCOUNT_ACTION` mail. The work result `{ sent }` tells whether a mail went out.
3. `loginWithLoginCode` consumes the challenge, verifies the address, moves a guest's cart like the other logins and logs in for `sessionExpiresInSeconds`. A wrong, used or expired link or code fails with `InvalidCredentials`.

The ACL actions `requestLoginCode` and `loginWithLoginCode` guard the mutations; every role has them by default.

```graphql
mutation RequestLoginCode {
  requestLoginCode(email: "user@example.com")
}
```

```graphql
mutation LoginWithLoginCode {
  loginWithLoginCode(email: "user@example.com", code: "482 913") {
    _id
    tokenExpires
  }
}
```

The link points to `EMAIL_WEBSITE_URL/login-code?token=…`. Mail scanners open links before the recipient does, so that storefront page should log in with `loginWithLoginCode(token)` on a click, not on load.

## Security

- Only HMAC-SHA256 hashes of the token and the code are stored, keyed with `UNCHAINED_TOKEN_SECRET`. The code only works with the address it was sent to, and each attempt is counted in the same update that consumes the challenge. Removing an address from a user voids the user's open challenges.
- The plain token and code are in the `USER_ACCOUNT_ACTION` event and in the `MESSAGE` and `EMAIL` work, like password reset tokens.
- A code only goes to an address that is verified on the account, or to an account without a password or passkey. An account that registered someone else's address with a login of its own gets none until the address is verified.
- Limit requests per IP at the reverse proxy, see [Rate Limiting](../deployment/security.md#rate-limiting).

## Related

- [Authentication](./authentication.md)
- [Login Code Worker](../plugins/workers/worker-login-code.md)
