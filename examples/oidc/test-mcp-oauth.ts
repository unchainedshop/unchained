#!/usr/bin/env node
/**
 * Test script for MCP OAuth authentication
 *
 * This script tests the proper MCP OAuth flow using Dynamic Client Registration (RFC 7591)
 * followed by Client Credentials grant to obtain an access token.
 *
 * MCP Authentication Flow:
 * 1. Discover OAuth endpoints from protected resource metadata
 * 2. Dynamically register a client with the authorization server
 * 3. Use the registered client credentials to obtain an access token
 * 4. Make authenticated requests to the MCP endpoint
 *
 * Prerequisites:
 * - Keycloak must have Dynamic Client Registration enabled
 * - Unchained server must be running with MCP endpoint configured
 *
 * Usage:
 *   npm run test-mcp-oauth
 */

import * as jose from 'jose';

const {
  UNCHAINED_KEYCLOAK_REALM_URL = 'http://localhost:8080/realms/master',
  UNCHAINED_KEYCLOAK_CLIENT_ID = '',
  ROOT_URL = 'http://localhost:4010',
  MCP_API_PATH = '/mcp',
  INITIAL_ACCESS_TOKEN = '', // Optional: Some Keycloak setups require this
} = process.env;

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in?: number;
  refresh_token?: string;
  token_type: string;
  id_token?: string;
  'not-before-policy'?: number;
  session_state?: string;
  scope: string;
}

interface ClientRegistrationResponse {
  client_id: string;
  client_secret?: string;
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
  registration_access_token?: string;
  registration_client_uri?: string;
}

async function registerClient(registrationEndpoint: string): Promise<ClientRegistrationResponse> {
  console.log('📝 Dynamically registering MCP client...');
  console.log(`   Registration endpoint: ${registrationEndpoint}`);

  try {
    const clientMetadata = {
      client_name: 'MCP Test Client',
      grant_types: ['client_credentials'],
      token_endpoint_auth_method: 'client_secret_basic',
      // No scope: Keycloak's registration policies reject 'openid' (not a client scope); the
      // realm's default client scopes apply, including 'roles' for resource_access claims.
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add initial access token if provided (required by some Keycloak configs)
    if (INITIAL_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${INITIAL_ACCESS_TOKEN}`;
    }

    const registrationResponse = await fetch(registrationEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(clientMetadata),
    });

    if (!registrationResponse.ok) {
      const errorText = await registrationResponse.text();
      throw new Error(
        `Failed to register client: ${registrationResponse.status} ${registrationResponse.statusText}\n${errorText}`
      );
    }

    const clientData: ClientRegistrationResponse = await registrationResponse.json();
    console.log('✅ Client registered successfully');
    console.log(`   Client ID: ${clientData.client_id}`);
    console.log(`   Client Secret: ${clientData.client_secret ? '***' + clientData.client_secret.slice(-4) : 'N/A'}`);

    return clientData;
  } catch (error) {
    console.error('❌ Failed to register client:', error.message);
    throw error;
  }
}

async function getAccessToken(clientId: string, clientSecret: string, tokenEndpoint: string): Promise<string> {
  console.log('\n🔐 Obtaining access token...');
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Grant Type: Client Credentials`);

  try {
    // Request token using client credentials grant
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'openid profile email',
    });

    // Use Basic Authentication with client credentials
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(
        `Failed to obtain token: ${tokenResponse.status} ${tokenResponse.statusText}\n${errorText}`
      );
    }

    const tokenData: TokenResponse = await tokenResponse.json();
    console.log('✅ Access token obtained successfully');
    console.log(`   Token type: ${tokenData.token_type}`);
    console.log(`   Expires in: ${tokenData.expires_in}s`);
    console.log(`   Scope: ${tokenData.scope}`);

    // Decode and display token info
    try {
      const payload = jose.decodeJwt(tokenData.access_token);
      console.log('\n📋 Token claims:');
      console.log(`   Subject: ${payload.sub}`);
      console.log(`   Issuer: ${payload.iss}`);
      console.log(`   Audience: ${payload.aud || 'N/A'}`);
      if ((payload as any).azp) {
        console.log(`   Authorized party: ${(payload as any).azp}`);
      }
    } catch {
      // Token couldn't be decoded, skip claims display
    }

    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Failed to obtain access token:', error.message);
    throw error;
  }
}

async function testMCPEndpoint(accessToken: string): Promise<void> {
  console.log('\n🧪 Testing MCP endpoint...');
  console.log(`   URL: ${ROOT_URL}${MCP_API_PATH}`);

  try {
    const response = await fetch(`${ROOT_URL}${MCP_API_PATH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        // Streamable HTTP transport requires both media types
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    console.log(`   Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`   Response body: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);

    if (response.ok) {
      console.log('✅ MCP endpoint responded successfully');
      try {
        const data = JSON.parse(responseText);
        console.log('\n📦 Response data:');
        console.log(JSON.stringify(data, null, 2));
      } catch {
        // Response wasn't JSON, that's ok
      }
    } else if (response.status === 403) {
      throw new Error(
        `MCP requires the admin role: grant the registered client's service account the "admin" role of client ` +
          `"${UNCHAINED_KEYCLOAK_CLIENT_ID}" and add that role to the registered client's scope mappings ` +
          `(dynamically registered clients have full scope disabled)`,
      );
    } else {
      throw new Error(`MCP endpoint returned ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Failed to test MCP endpoint:', error.message);
    throw error;
  }
}

async function testOAuthProtectedResource(): Promise<any> {
  console.log(`   URL: ${ROOT_URL}/.well-known/oauth-protected-resource`);

  try {
    const response = await fetch(`${ROOT_URL}/.well-known/oauth-protected-resource`);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Protected resource metadata:');
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Failed to test protected resource:', error.message);
    throw error;
  }
}

async function getAuthorizationServerMetadata(authServerUrl: string): Promise<any> {
  console.log(`   Authorization Server: ${authServerUrl}`);
  console.log(`   Metadata URL: ${authServerUrl}/.well-known/oauth-authorization-server`);

  try {
    const response = await fetch(`${authServerUrl}/.well-known/oauth-authorization-server`);

    if (!response.ok) {
      // Fallback to OpenID Connect discovery if oauth-authorization-server is not available
      console.log('   Trying OpenID Connect discovery instead...');
      const oidcResponse = await fetch(`${authServerUrl}/.well-known/openid-configuration`);

      if (!oidcResponse.ok) {
        throw new Error(`Failed to fetch authorization server metadata: ${response.status} ${response.statusText}`);
      }

      const oidcData = await oidcResponse.json();
      console.log('✅ Authorization server metadata (via OIDC discovery):');
      console.log(JSON.stringify(oidcData, null, 2));
      return oidcData;
    }

    const data = await response.json();
    console.log('✅ Authorization server metadata:');
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Failed to get authorization server metadata:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 MCP OAuth Test Suite (Dynamic Client Registration)\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check if Keycloak is accessible
    console.log('\n📡 Test 1: Checking Keycloak availability...');
    const discoveryResponse = await fetch(
      `${UNCHAINED_KEYCLOAK_REALM_URL}/.well-known/openid-configuration`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!discoveryResponse.ok) {
      throw new Error('Keycloak is not accessible');
    }
    console.log('✅ Keycloak is running and accessible');

    // Test 2: Check if Unchained server is running
    console.log('\n📡 Test 2: Checking Unchained server availability...');
    const serverResponse = await fetch(ROOT_URL, {
      signal: AbortSignal.timeout(5000),
      redirect: 'manual'
    });
    console.log(`✅ Unchained server is running (status: ${serverResponse.status})`);

    // Test 3: Get OAuth protected resource metadata
    console.log('\n📡 Test 3: Discovering OAuth protected resource...');
    const protectedResourceMetadata = await testOAuthProtectedResource();

    // Test 4: Get Authorization Server Metadata
    console.log('\n' + '=' .repeat(60));
    console.log('📡 Test 4: Discovering Authorization Server metadata');

    // Get the first authorization server from the protected resource metadata
    const authServerUrl = protectedResourceMetadata.authorization_servers?.[0] || UNCHAINED_KEYCLOAK_REALM_URL;
    const authServerMetadata = await getAuthorizationServerMetadata(authServerUrl);

    // Test 5: Dynamic Client Registration
    console.log('\n' + '=' .repeat(60));
    console.log('📡 Test 5: Dynamic Client Registration');

    // Use the registration endpoint from discovery, or fallback to Keycloak's default
    const registrationEndpoint = authServerMetadata.registration_endpoint ||
                                  `${authServerUrl}/clients-registrations/default`;
    console.log(`   Using registration endpoint: ${registrationEndpoint}`);

    const clientData = await registerClient(registrationEndpoint);

    if (!clientData.client_secret) {
      throw new Error('Client registration did not return a client_secret');
    }

    // Test 6: Obtain access token with registered client
    console.log('\n' + '=' .repeat(60));
    console.log('📡 Test 6: Obtaining access token with registered client');
    const accessToken = await getAccessToken(
      clientData.client_id,
      clientData.client_secret,
      authServerMetadata.token_endpoint
    );

    // Test 7: Test MCP endpoint with token
    console.log('\n' + '=' .repeat(60));
    console.log('📡 Test 7: Testing MCP endpoint with access token');
    await testMCPEndpoint(accessToken);

    console.log('\n' + '=' .repeat(60));
    console.log('\n🎉 All tests completed successfully!\n');
    console.log('✅ MCP authentication flow with Dynamic Client Registration works!\n');

  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('\n❌ Test suite failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Ensure Keycloak is running (see README: docker run ... quay.io/keycloak/keycloak start-dev)');
    console.error('   2. Ensure Unchained server is running: npm run dev');
    console.error('   3. Check environment variables in .env file');
    console.error('   4. Enable Dynamic Client Registration in Keycloak:');
    console.error('      - Realm Settings → Client Registration → Anonymous Access Policy');
    console.error('      - Or set INITIAL_ACCESS_TOKEN in .env for authenticated registration');
    console.error('   5. Verify the realm name matches in UNCHAINED_KEYCLOAK_REALM_URL\n');
    process.exit(1);
  }
}

main();
