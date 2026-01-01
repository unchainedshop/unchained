# Unchained OIDC JWT Federation Example

This example demonstrates how to integrate [Unchained Commerce](https://unchained.shop) with OpenID Connect (OIDC) providers using **JWT Federation** - a stateless approach where external OIDC tokens are verified directly via JWKS.

## How It Works

Instead of maintaining server-side sessions, this approach:
1. Accepts JWT access tokens from external OIDC providers (Keycloak, Auth0, Zitadel, etc.)
2. Verifies tokens using the provider's public JWKS endpoint
3. Automatically creates users on first login (optional)
4. Maps OIDC claims to user profile and roles

## Prerequisites

- Node.js >=22
- An OIDC provider (Keycloak, Auth0, Zitadel, etc.)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your OIDC provider environment variables (see examples below)

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Authenticate with your OIDC provider to obtain a JWT access token

5. Make requests to Unchained with the token:
   ```bash
   curl -H "Authorization: Bearer <your-jwt-token>" http://localhost:4010/graphql
   ```

## Environment Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `OIDC_PROVIDER_NAME` | No | Name for the provider (default: 'oidc') |
| `OIDC_ISSUER_URL` | Yes | OIDC issuer URL (must match 'iss' claim) |
| `OIDC_AUDIENCE` | Yes | Expected audience (typically client ID) |
| `OIDC_ROLES_PATH` | No | Path to roles in token (dot-separated) |

## Provider Examples

### Keycloak

```env
OIDC_PROVIDER_NAME=keycloak
OIDC_ISSUER_URL=https://keycloak.example.com/realms/myrealm
OIDC_AUDIENCE=my-client-id
OIDC_ROLES_PATH=resource_access.my-client-id.roles
```

**Local Development:**
```bash
docker run -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```

### Auth0

```env
OIDC_PROVIDER_NAME=auth0
OIDC_ISSUER_URL=https://your-tenant.auth0.com/
OIDC_AUDIENCE=your-api-audience
```

### Zitadel

```env
OIDC_PROVIDER_NAME=zitadel
OIDC_ISSUER_URL=https://your-instance.zitadel.cloud
OIDC_AUDIENCE=your-project-id
OIDC_ROLES_PATH=urn:zitadel:iam:org:project:roles
```

## Multiple Providers

The OIDC strategy supports multiple providers simultaneously. To configure multiple providers, modify the `boot.ts` file directly:

```typescript
const oidcStrategy = await createOIDCStrategy({
  providers: [
    {
      name: 'keycloak',
      issuer: 'https://keycloak.example.com/realms/myrealm',
      audience: 'my-client-id',
    },
    {
      name: 'auth0',
      issuer: 'https://your-tenant.auth0.com/',
      audience: 'your-api-audience',
    },
  ],
});
```

## Role Mapping

Map external roles to internal Unchained roles:

```typescript
{
  name: 'keycloak',
  issuer: '...',
  audience: '...',
  rolesPath: ['resource_access', 'my-client', 'roles'],
  roleMapping: {
    'realm-admin': 'admin',
    'realm-user': 'user',
  },
}
```

## Resources

- [Unchained Commerce Documentation](https://docs.unchained.shop)
- [OpenID Connect Specification](https://openid.net/developers/how-connect-works/)
- [JSON Web Key Set (JWKS)](https://datatracker.ietf.org/doc/html/rfc7517)

## Support

- [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
- [Unchained Commerce Website](https://unchained.shop)
