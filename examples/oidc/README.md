# Unchained OpenID Connect Example

This example demonstrates how to integrate [Unchained Commerce](https://unchained.shop) with OpenID Connect (OIDC) providers like [Zitadel](https://zitadel.com) and [Keycloak](https://www.keycloak.org).

## Prerequisites

- Node.js >=26
- An OIDC provider (Zitadel Cloud or Keycloak instance)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure your OIDC provider (see sections below)

3. Run the development server:
   ```bash
   npm run dev
   ```

## Zitadel Setup

[Zitadel](https://zitadel.com) is a modern identity and access management platform that provides secure authentication and authorization.

### Step-by-step Configuration

1. **Create a Zitadel Cloud Account**
   - Visit [zitadel.cloud](https://zitadel.cloud) and sign up for a free account
   - Create a new project or use the default project

2. **Create an Application**
   - Navigate to your project settings
   - Click on "Applications" and create a new application
   - Choose "Web Application" as the application type
   - Select "PKCE" (Proof Key for Code Exchange) for enhanced security

3. **Configure Application Settings**
   - Set the redirect URI to `http://localhost:4010/login/zitadel/callback` (or your `ROOT_URL` plus `UNCHAINED_ZITADEL_CALLBACK_PATH`)
   - Enable *Development Mode* while you use `http://` redirect URIs
   - Note down your Client ID

4. **Roles and Logout**
   - Create a project role `admin` and grant it to the users who should manage the shop. On login, the project roles become the user's Unchained roles.
   - Enable *Assert Roles on Authentication* on the project and *User roles inside ID Token* on the application. Otherwise the ID token carries no roles and users log in without permissions.
   - Optional: set the back-channel logout URI to `ROOT_URL/backchannel-logout`. Zitadel only accepts publicly reachable hosts there.

5. **Environment Configuration**

   Create a `.env` file with the following variables:

   ```env
   UNCHAINED_ZITADEL_CLIENT_ID=your_client_id_here
   UNCHAINED_ZITADEL_DISCOVERY_URL=https://your-instance.zitadel.cloud
   ```

### Resources

- [Zitadel Documentation](https://zitadel.com/docs)
- [PKCE Flow Guide](https://zitadel.com/docs/guides/integrate/login/oidc/oauth-recommended-flows#authorization-code-with-proof-key-for-code-exchange-pkce)

## Keycloak Setup

[Keycloak](https://www.keycloak.org) is an open-source identity and access management solution for modern applications and services.

### Local Development Setup

1. **Start Keycloak**

   ```bash
   # Using Docker
   docker run -p 127.0.0.1:8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
   ```

2. **Access Admin Console**
   - Navigate to [http://localhost:8080](http://localhost:8080)
   - Login with admin/admin credentials

3. **Create a Realm**
   - Create a new realm (e.g., "myrealm")
   - Or use the master realm for testing

4. **Create a Client**
   - Navigate to "Clients" and create a new client
   - Set Client ID to "myclient" (or your preferred name)
   - Set the redirect URI to `http://localhost:4010/login/keycloak/callback` (or your `ROOT_URL` plus `UNCHAINED_KEYCLOAK_CALLBACK_PATH`) and the post logout redirect URI to `http://localhost:4010/*`
   - If client authentication is enabled, copy the client secret into `UNCHAINED_KEYCLOAK_CLIENT_SECRET`
   - Set the backchannel logout URL to `ROOT_URL/backchannel-logout` and keep *Backchannel logout session required* on. Keycloak running in Docker reaches your machine at `http://host.docker.internal:4010/backchannel-logout`

5. **Roles**
   - Create a client role `admin` (Clients → your client → Roles) and assign it to the users who should manage the shop
   - On login, the client roles become the user's Unchained roles. The example reads them from the access token, because Keycloak doesn't add client roles to the ID token by default
   - Users are stored as `<client id>:<subject>`. The provider's `userIdFromSubject` maps back-channel logout and bearer tokens to the same user

6. **Bearer Tokens (optional)**

   To call the GraphQL API with a Keycloak access token (`Authorization: Bearer …`), the token's audience must contain your client id. Add an *Audience* mapper for your client to its dedicated client scope.

7. **Environment Configuration**

   Add to your `.env` file:

   ```env
   UNCHAINED_KEYCLOAK_CLIENT_ID=myclient
   UNCHAINED_KEYCLOAK_REALM_URL=http://localhost:8080/realms/myrealm
   ```

### Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Getting Started Guide](https://www.keycloak.org/getting-started)
- [Docker Setup](https://www.keycloak.org/getting-started/getting-started-docker)

## Advanced: MCP Server Authorization

Our Keycloak example includes advanced support for **OAuth 2.1** authentication protecting the **Model Context Protocol (MCP) Server** of Unchained Engine.

### What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is a standardized way for AI models to securely access external data sources and tools.

### OAuth 2.1 Protection

This example implements OAuth 2.1 authorization as specified in the [MCP Authorization Specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).

### Usage

Once configured, you can expose your MCP server to compatible MCP clients with proper OAuth 2.1 authentication, ensuring secure access to your Unchained Commerce data and operations.

MCP clients register themselves with Keycloak (Dynamic Client Registration) and use the client credentials grant. The MCP server requires the `admin` role, so after a client registered:

1. Grant the registered client's service account the `admin` role of your Unchained client (`UNCHAINED_KEYCLOAK_CLIENT_ID`).
2. Add that role to the registered client's scope mappings. Dynamically registered clients have full scope disabled, so otherwise the role never reaches the token.

`npm run test-mcp-oauth` walks through the whole flow. Anonymous registration is limited by the realm's client registration policies; set `INITIAL_ACCESS_TOKEN` (Realm settings → Client registration → Initial access token) or add your host to the *Trusted Hosts* policy.

## Learn More

- [Unchained Commerce Documentation](https://docs.unchained.shop)
- [OpenID Connect Specification](https://openid.net/developers/how-connect-works/)
- [OAuth 2.1 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Model Context Protocol](https://modelcontextprotocol.io)

## Support

For questions and support:

- [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
- [Unchained Commerce Website](https://unchained.shop)
