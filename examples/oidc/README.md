# Unchained OpenID Connect Example

This example demonstrates how to integrate [Unchained Commerce](https://unchained.shop) with OpenID Connect (OIDC) providers like [Zitadel](https://zitadel.com) and [Keycloak](https://www.keycloak.org).

## Prerequisites

- Node.js 26.8.2 or newer (26.8.2 is pinned) for repository development (see [`.nvmrc`](../../.nvmrc))
- An OIDC provider (Zitadel Cloud or Keycloak instance)

## Getting Started

1. Install and build from the repository root, then enter the example:

   ```bash
   npm install
   npm run build
   cd examples/oidc
   ```

2. Configure one OIDC provider in `examples/oidc/.env` (see sections below). Zitadel takes precedence when both client IDs are set.

3. Run the development server:
   ```bash
   npm run dev
   ```

The default server URL is `http://localhost:4010`; `/login` starts the configured provider flow and `/graphql` exposes the API.

## Zitadel Setup

[Zitadel](https://zitadel.com) is a modern identity and access management platform that provides secure authentication and authorization.

### Step-by-step Configuration

1. **Create a Zitadel Cloud Account**
   - Visit [zitadel.cloud](https://zitadel.cloud) and create an account
   - Create a new project or use the default project

2. **Create an Application**
   - Navigate to your project settings
   - Click on "Applications" and create a new application
   - Choose "Web Application" as the application type
   - Select "PKCE" (Proof Key for Code Exchange) for enhanced security

3. **Configure Application Settings**
   - Set your redirect URIs (e.g., `http://localhost:4010/login/zitadel/callback`)
   - Note down your Client ID

4. **Environment Configuration**

   Create a `.env` file with the following variables:

   ```env
   UNCHAINED_ZITADEL_CLIENT_ID=your_client_id_here
   UNCHAINED_ZITADEL_DISCOVERY_URL=https://your-instance.zitadel.cloud
   ```

Despite its name, `UNCHAINED_ZITADEL_DISCOVERY_URL` is the issuer base URL passed to `@fastify/oauth2` discovery, without the `/.well-known/openid-configuration` suffix.

### Resources

- [Zitadel Documentation](https://zitadel.com/docs)
- [PKCE Flow Guide](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows#authorization-code-with-proof-key-for-code-exchange-pkce)

## Keycloak Setup

[Keycloak](https://www.keycloak.org) is an open-source identity and access management solution for modern applications and services.

### Local Development Setup

1. **Start Keycloak**

   ```bash
   # Using Docker
   docker run -p 127.0.0.1:8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:26.7.3 start-dev
   ```

2. **Access Admin Console**
   - Navigate to [http://localhost:8080](http://localhost:8080)
   - Login with admin/admin credentials

3. **Create a Realm**
   - Create a new realm (e.g., "myrealm")
   - Keep the master realm for Keycloak administration

4. **Create a Client**
   - Navigate to "Clients" and create a new client
   - Set Client ID to "myclient" (or your preferred name)
   - Enable the standard authorization code flow
   - Set the redirect URI to `http://localhost:4010/login/keycloak/callback`
   - Set the post-logout redirect URI to `http://localhost:4010/`
   - For a confidential client, enable client authentication and copy the client secret

5. **Environment Configuration**

   Add to your `.env` file:

   ```env
   UNCHAINED_KEYCLOAK_CLIENT_ID=myclient
   UNCHAINED_KEYCLOAK_CLIENT_SECRET=your_client_secret
   UNCHAINED_KEYCLOAK_REALM_URL=http://localhost:8080/realms/myrealm
   ```

### Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Getting Started Guide](https://www.keycloak.org/getting-started)
- [Docker Setup](https://www.keycloak.org/getting-started/getting-started-docker)

## Advanced: MCP Server Authorization

The Keycloak example demonstrates bearer-token authentication for the **Model Context Protocol (MCP) server** of Unchained Engine.

### What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is a standardized way for AI models to securely access external data sources and tools.

### Authorization integration

The Keycloak adapter exposes protected-resource metadata at `/.well-known/oauth-protected-resource`, verifies bearer tokens on `/mcp`, and maps client roles into the Unchained context. It illustrates an integration with the [MCP Authorization Specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization); it does not exercise every requirement of that specification.

### Usage

Configure the client roles in Keycloak for the Unchained operations you need. `npm run test-mcp-oauth` exercises dynamic client registration and a client-credentials token request; it requires Keycloak to allow registration and the registered service account to receive the required roles. This test is separate from the browser authorization-code login flow.

## Learn More

- [Unchained Commerce Documentation](https://docs.unchained.shop)
- [OpenID Connect Specification](https://openid.net/developers/how-connect-works/)
- [OAuth 2.1 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Model Context Protocol](https://modelcontextprotocol.io)

## Support

For questions and support:

- [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
- [Unchained Commerce Website](https://unchained.shop)
