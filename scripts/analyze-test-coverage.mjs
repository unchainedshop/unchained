#!/usr/bin/env node
/**
 * Comprehensive script to analyze GraphQL API and REST endpoint test coverage
 * This script generates a detailed coverage report for the Unchained shop platform
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const baseDir = '/home/runner/work/unchained/unchained';

// Extract all GraphQL operations from schema files
function extractAllGraphQLOperations() {
  const mutationSchema = readFileSync(join(baseDir, 'packages/api/src/schema/mutation.ts'), 'utf-8');
  const querySchema = readFileSync(join(baseDir, 'packages/api/src/schema/query.ts'), 'utf-8');
  
  const operations = {
    mutations: [],
    queries: []
  };
  
  // Extract mutations and queries - look for operation_name(params): ReturnType pattern
  const operationRegex = /^\s+(\w+)\s*\([^)]*\)\s*:\s*[\w\[\]!]+/gm;
  let match;
  
  while ((match = operationRegex.exec(mutationSchema)) !== null) {
    const name = match[1];
    if (name && name !== 'Mutation' && name !== 'type') {
      operations.mutations.push(name);
    }
  }
  
  while ((match = operationRegex.exec(querySchema)) !== null) {
    const name = match[1];
    if (name && name !== 'Query' && name !== 'type') {
      operations.queries.push(name);
    }
  }
  
  return operations;
}

// Extract REST endpoints from all fastify configuration files
function extractRESTEndpoints() {
  const endpoints = [];
  
  // Check plugins all-fastify preset
  const allFastifyPath = join(baseDir, 'packages/plugins/src/presets/all-fastify.ts');
  const allFastifyContent = readFileSync(allFastifyPath, 'utf-8');
  
  // Extract environment variable defaults
  const envRegex = /([A-Z_]+)\s*=\s*'([^']+)'/g;
  const envDefaults = {};
  let match;
  
  while ((match = envRegex.exec(allFastifyContent)) !== null) {
    envDefaults[match[1]] = match[2];
  }
  
  // Extract route configurations
  const routeRegex = /s?\.route\(\{[^}]*url:\s*([A-Z_]+),\s*method:\s*'(\w+)',\s*handler:\s*(\w+)/g;
  
  while ((match = routeRegex.exec(allFastifyContent)) !== null) {
    const [_, urlVar, method, handler] = match;
    endpoints.push({ 
      urlVar, 
      method, 
      handler, 
      url: envDefaults[urlVar] || urlVar,
      source: 'plugins/all-fastify.ts',
      category: 'Payment Webhooks'
    });
  }
  
  // Check base-fastify preset (GridFS)
  const baseFastifyPath = join(baseDir, 'packages/plugins/src/presets/base-fastify.ts');
  const baseFastifyContent = readFileSync(baseFastifyPath, 'utf-8');
  
  const gridfsMatch = /GRIDFS_PUT_SERVER_PATH = '([^']+)'/.exec(baseFastifyContent);
  if (gridfsMatch) {
    endpoints.push({
      urlVar: 'GRIDFS_PUT_SERVER_PATH',
      method: 'GET/PUT/OPTIONS',
      handler: 'gridfsHandler',
      url: gridfsMatch[1],
      source: 'plugins/base-fastify.ts',
      category: 'File Storage'
    });
  }
  
  // Check crypto-fastify preset
  const cryptoFastifyPath = join(baseDir, 'packages/plugins/src/presets/crypto-fastify.ts');
  const cryptoFastifyContent = readFileSync(cryptoFastifyPath, 'utf-8');
  
  const cryptopayMatch = /CRYPTOPAY_WEBHOOK_PATH = '([^']+)'/.exec(cryptoFastifyContent);
  if (cryptopayMatch) {
    endpoints.push({
      urlVar: 'CRYPTOPAY_WEBHOOK_PATH',
      method: 'POST',
      handler: 'cryptopayHandler',
      url: cryptopayMatch[1],
      source: 'plugins/crypto-fastify.ts',
      category: 'Payment Webhooks'
    });
  }
  
  // Check ticketing endpoints
  const ticketingPath = join(baseDir, 'packages/ticketing/src/fastify.ts');
  if (statSync(ticketingPath, { throwIfNoEntry: false })) {
    const content = readFileSync(ticketingPath, 'utf-8');
    
    const appleMatch = /APPLE_WALLET_WEBSERVICE_PATH = '([^']+)'/.exec(content);
    if (appleMatch) {
      endpoints.push({
        urlVar: 'APPLE_WALLET_WEBSERVICE_PATH',
        method: 'GET/POST/DELETE',
        handler: 'appleWalletHandler',
        url: appleMatch[1],
        source: 'ticketing/fastify.ts',
        category: 'Ticketing'
      });
    }
    
    const googleMatch = /GOOGLE_WALLET_WEBSERVICE_PATH = '([^']+)'/.exec(content);
    if (googleMatch) {
      endpoints.push({
        urlVar: 'GOOGLE_WALLET_WEBSERVICE_PATH',
        method: 'POST',
        handler: 'googleWalletHandler',
        url: googleMatch[1],
        source: 'ticketing/fastify.ts',
        category: 'Ticketing'
      });
    }
    
    const printMatch = /UNCHAINED_PDF_PRINT_HANDLER_PATH = '([^']+)'/.exec(content);
    if (printMatch) {
      endpoints.push({
        urlVar: 'UNCHAINED_PDF_PRINT_HANDLER_PATH',
        method: 'POST',
        handler: 'printTicketsHandler',
        url: printMatch[1],
        source: 'ticketing/fastify.ts',
        category: 'Ticketing'
      });
    }
  }
  
  return endpoints;
}

// Extract tested operations and endpoints from test files
function extractTestedOperations() {
  const tested = {
    graphql: new Set(),
    rest: new Map() // Map of URL to test file names
  };
  
  const testDir = join(baseDir, 'tests');
  const testFiles = readdirSync(testDir).filter(f => f.endsWith('.test.js'));
  
  for (const file of testFiles) {
    const content = readFileSync(join(testDir, file), 'utf-8');
    
    // Extract GraphQL operation names from test queries
    const graphqlMatches = content.matchAll(/(?:query|mutation)\s+(\w+)/g);
    for (const match of graphqlMatches) {
      tested.graphql.add(match[1]);
    }
    
    // Also extract operation names from inline queries (without explicit operation name)
    const inlineOpMatches = content.matchAll(/query:\s*\/\*\s*GraphQL\s*\*\/\s*`[^`]*?\b(\w+)\s*\(/g);
    for (const match of inlineOpMatches) {
      const opName = match[1];
      // Skip common keywords
      if (!['query', 'mutation', 'fragment', 'on', 'Query', 'Mutation'].includes(opName)) {
        tested.graphql.add(opName);
      }
    }
    
    // Extract REST endpoint tests - use a simpler, more precise regex
    const lines = content.split('\n');
    for (const line of lines) {
      const fetchMatch = line.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (fetchMatch) {
        const url = fetchMatch[1];
        const pathMatch = url.match(/https?:\/\/[^\/]+(.+)/);
        const path = pathMatch ? pathMatch[1] : url;
        
        if (!tested.rest.has(path)) {
          tested.rest.set(path, []);
        }
        tested.rest.get(path).push(file);
      }
    }
  }
  
  return tested;
}

// Main analysis
console.log('# Unchained E-Commerce Platform - Test Coverage Analysis\n');
console.log('This document provides a comprehensive overview of GraphQL API and REST endpoint test coverage.\n');

const operations = extractAllGraphQLOperations();
const endpoints = extractRESTEndpoints();
const tested = extractTestedOperations();

// Calculate coverage stats
const testedMutations = operations.mutations.filter(m => tested.graphql.has(m));
const untestedMutations = operations.mutations.filter(m => !tested.graphql.has(m));
const testedQueries = operations.queries.filter(q => tested.graphql.has(q));
const untestedQueries = operations.queries.filter(q => !tested.graphql.has(q));

const totalGraphQL = operations.mutations.length + operations.queries.length;
const testedGraphQL = testedMutations.length + testedQueries.length;
const graphqlCoverage = Math.round((testedGraphQL / totalGraphQL) * 100);

// Calculate REST endpoint coverage by checking if paths match
const testedEndpoints = endpoints.filter(ep => {
  const url = ep.url;
  for (const [testUrl, files] of tested.rest.entries()) {
    const urlPath = url.replace(/^\//, '');
    const testPath = testUrl.replace(/^\//, '');
    
    if (testPath.includes(urlPath) || urlPath.includes(testPath)) {
      return true;
    }
  }
  return false;
});
const restCoverage = endpoints.length > 0 ? Math.round((testedEndpoints.length / endpoints.length) * 100) : 0;

console.log('## Summary Statistics\n');
console.log('| Category | Total | Tested | Untested | Coverage |');
console.log('|----------|-------|--------|----------|----------|');
console.log(`| **GraphQL Mutations** | ${operations.mutations.length} | ${testedMutations.length} | ${untestedMutations.length} | ${Math.round((testedMutations.length / operations.mutations.length) * 100)}% |`);
console.log(`| **GraphQL Queries** | ${operations.queries.length} | ${testedQueries.length} | ${untestedQueries.length} | ${Math.round((testedQueries.length / operations.queries.length) * 100)}% |`);
console.log(`| **Total GraphQL** | ${totalGraphQL} | ${testedGraphQL} | ${totalGraphQL - testedGraphQL} | **${graphqlCoverage}%** |`);

// REST endpoint coverage
console.log(`| **REST Endpoints** | ${endpoints.length} | ${testedEndpoints.length} | ${endpoints.length - testedEndpoints.length} | **${restCoverage}%** |\n`);

// REST Endpoints Table
console.log('## REST Endpoints Coverage\n');
console.log('| Status | Method | URL | Handler | Category | Tested In |');
console.log('|--------|--------|-----|---------|----------|-----------|');

endpoints.forEach(ep => {
  const url = ep.url;
  const testFiles = [];
  
  for (const [testUrl, files] of tested.rest.entries()) {
    // Match on the path portion
    const urlPath = url.replace(/^\//, '');
    const testPath = testUrl.replace(/^\//, '');
    
    if (testPath.includes(urlPath) || urlPath.includes(testPath)) {
      testFiles.push(...files);
    }
  }
  
  const isTested = testFiles.length > 0;
  const status = isTested ? '✅' : '❌';
  const testFilesList = isTested ? [...new Set(testFiles)].join(', ') : '-';
  
  console.log(`| ${status} | ${ep.method} | \`${url}\` | ${ep.handler} | ${ep.category} | ${testFilesList} |`);
});

console.log('\n## GraphQL Mutations Coverage\n');
console.log('| Status | Mutation | Category |');
console.log('|--------|----------|----------|');

// Group mutations by category
const mutationCategories = {
  'Authentication & Users': ['loginWithPassword', 'loginWithWebAuthn', 'loginAsGuest', 'createUser', 'logout', 'impersonate', 'stopImpersonation', 'heartbeat', 'changePassword', 'forgotPassword', 'resetPassword', 'verifyEmail', 'sendVerificationEmail', 'enrollUser', 'removeUser', 'setUsername', 'setPassword', 'updateUser', 'updateUserAvatar', 'addEmail', 'removeEmail', 'verifyEmail', 'setRoles', 'setTags'],
  'Web3 & WebAuthn': ['addWeb3Address', 'verifyWeb3Address', 'removeWeb3Address', 'addWebAuthnCredentials', 'removeWebAuthnCredentials', 'createWebAuthnCredentialCreationOptions', 'createWebAuthnCredentialRequestOptions'],
  'Products': ['createProduct', 'updateProduct', 'updateProductTexts', 'updateProductCommerce', 'updateProductSupply', 'updateProductWarehousing', 'updateProductTokenization', 'publishProduct', 'unpublishProduct', 'removeProduct', 'addProductMedia', 'reorderProductMedia', 'removeProductMedia', 'updateProductMediaTexts'],
  'Product Variations': ['createProductVariation', 'createProductVariationOption', 'updateProductVariationTexts', 'removeProductVariation', 'removeProductVariationOption'],
  'Product Bundles': ['createProductBundleItem', 'removeBundleItem'],
  'Product Reviews': ['createProductReview', 'updateProductReview', 'removeProductReview', 'addProductReviewVote', 'removeProductReviewVote', 'removeUserProductReviews'],
  'Assortments': ['createAssortment', 'updateAssortment', 'updateAssortmentTexts', 'removeAssortment', 'setBaseAssortment', 'addAssortmentProduct', 'removeAssortmentProduct', 'reorderAssortmentProducts', 'addAssortmentLink', 'reorderAssortmentLinks', 'addAssortmentFilter', 'removeAssortmentFilter', 'reorderAssortmentFilters', 'addAssortmentMedia', 'removeAssortmentMedia', 'reorderAssortmentMedia', 'updateAssortmentMediaTexts'],
  'Filters': ['createFilter', 'updateFilter', 'updateFilterTexts', 'removeFilter', 'createFilterOption', 'removeFilterOption'],
  'Warehousing': ['createWarehousingProvider', 'updateWarehousingProvider', 'removeWarehousingProvider'],
  'Delivery': ['createDeliveryProvider', 'updateDeliveryProvider', 'removeDeliveryProvider'],
  'Payment': ['createPaymentProvider', 'updatePaymentProvider', 'removePaymentProvider', 'signPaymentProviderForCheckout', 'signPaymentProviderForCredentialRegistration'],
  'Orders & Cart': ['addCartProduct', 'addCartDiscount', 'addCartQuotation', 'updateCart', 'emptyCart', 'removeCart', 'removeCartItem', 'removeCartDiscount', 'updateCartItem', 'checkoutCart', 'createCart', 'updateCartDeliveryShipping', 'updateCartDeliveryPickUp', 'updateCartPaymentGeneric', 'updateCartPaymentInvoice'],
  'Order Management': ['updateOrderDeliveryShipping', 'updateOrderDeliveryPickUp', 'setOrderPaymentCredentials', 'confirmOrder', 'payOrder', 'deliverOrder', 'rejectOrder', 'cancelOrder', 'markOrderConfirmed', 'markOrderPaid', 'markOrderDelivered', 'markOrderRejected', 'markOrderCancelled'],
  'Quotations': ['requestQuotation', 'verifyQuotation', 'rejectQuotation', 'makeQuotationProposal'],
  'Enrollments': ['createEnrollment', 'removeEnrollment', 'updateEnrollment', 'setEnrollmentPeriod', 'terminateEnrollment', 'activateEnrollment'],
  'Bookmarks': ['bookmark', 'removeBookmark'],
  'Subscriptions': ['subscribe', 'unsubscribe', 'updateSubscription'],
  'Warehousing Assignments': ['addProductAssignment', 'removeProductAssignment'],
  'Push Notifications': ['addPushSubscription', 'removePushSubscription'],
  'Tokens': ['exportToken', 'invalidateToken'],
  'Events & Tracking': ['pageView'],
  'Work Queue': ['processNextWork'],
};

const categorizedMutations = new Map();
operations.mutations.forEach(m => {
  let category = 'Other';
  for (const [cat, muts] of Object.entries(mutationCategories)) {
    if (muts.includes(m)) {
      category = cat;
      break;
    }
  }
  if (!categorizedMutations.has(category)) {
    categorizedMutations.set(category, []);
  }
  categorizedMutations.get(category).push(m);
});

for (const [category, muts] of [...categorizedMutations.entries()].sort()) {
  muts.sort().forEach(m => {
    const status = tested.graphql.has(m) ? '✅' : '❌';
    console.log(`| ${status} | \`${m}\` | ${category} |`);
  });
}

console.log('\n## GraphQL Queries Coverage\n');
console.log('| Status | Query | Category |');
console.log('|--------|-------|----------|');

// Group queries by category
const queryCategories = {
  'Users': ['me', 'impersonator', 'user', 'users', 'usersCount'],
  'Products': ['product', 'products', 'productsCount', 'productCatalogPrices', 'translatedProductTexts', 'translatedProductMediaTexts', 'translatedProductVariationTexts'],
  'Search': ['searchProducts', 'searchAssortments'],
  'Assortments': ['assortment', 'assortments', 'assortmentsCount', 'translatedAssortmentTexts', 'translatedAssortmentMediaTexts'],
  'Filters': ['filter', 'filters', 'filtersCount', 'translatedFilterTexts'],
  'Orders': ['order', 'orders', 'ordersCount', 'orderStatistics'],
  'Quotations': ['quotation', 'quotations', 'quotationsCount'],
  'Enrollments': ['enrollment', 'enrollments', 'enrollmentsCount'],
  'Product Reviews': ['productReview', 'productReviews', 'productReviewsCount'],
  'Warehousing': ['warehousingProvider', 'warehousingProviders', 'warehousingProvidersCount', 'warehousingInterfaces'],
  'Delivery': ['deliveryProvider', 'deliveryProviders', 'deliveryProvidersCount', 'deliveryInterfaces'],
  'Payment': ['paymentProvider', 'paymentProviders', 'paymentProvidersCount', 'paymentInterfaces'],
  'Localization': ['languages', 'languagesCount', 'countries', 'countriesCount', 'currencies', 'currenciesCount'],
  'Tokens': ['token', 'tokens', 'tokensCount', 'validateResetPasswordToken', 'validateVerifyEmailToken'],
  'Events & Statistics': ['event', 'events', 'eventsCount', 'eventStatistics', 'workQueueCount', 'workStatistics'],
  'Shop Config': ['shopInfo', 'activeWorkTypes'],
};

const categorizedQueries = new Map();
operations.queries.forEach(q => {
  let category = 'Other';
  for (const [cat, queries] of Object.entries(queryCategories)) {
    if (queries.includes(q)) {
      category = cat;
      break;
    }
  }
  if (!categorizedQueries.has(category)) {
    categorizedQueries.set(category, []);
  }
  categorizedQueries.get(category).push(q);
});

for (const [category, queries] of [...categorizedQueries.entries()].sort()) {
  queries.sort().forEach(q => {
    const status = tested.graphql.has(q) ? '✅' : '❌';
    console.log(`| ${status} | \`${q}\` | ${category} |`);
  });
}

console.log('\n## Key Findings\n');
console.log('### Missing Test Coverage\n');
console.log('#### Critical Payment Webhooks Without Tests:\n');

const criticalEndpoints = [
  '/payment/stripe',
];

criticalEndpoints.forEach(url => {
  const endpoint = endpoints.find(ep => ep.url === url);
  if (endpoint) {
    const testFiles = [];
    for (const [testUrl, files] of tested.rest.entries()) {
      if (testUrl.includes(url.replace(/^\//, '')) || url.includes(testUrl.replace(/^\//, ''))) {
        testFiles.push(...files);
      }
    }
    if (testFiles.length === 0) {
      console.log(`- ❌ **${endpoint.method} ${url}** (${endpoint.handler}) - No webhook tests found`);
    }
  }
});

console.log('\n#### High-Priority Untested GraphQL Operations:\n');

const highPriorityOps = [
  'addWeb3Address', 'verifyWeb3Address', 'removeWeb3Address',
  'addWebAuthnCredentials', 'removeWebAuthnCredentials', 'loginWithWebAuthn',
  'publishProduct', 'unpublishProduct',
  'createAssortment', 'updateAssortment',
  'createFilter', 'updateFilter',
  'impersonate',
];

highPriorityOps.forEach(op => {
  if (!tested.graphql.has(op)) {
    const isMutation = operations.mutations.includes(op);
    console.log(`- ❌ **${op}** (${isMutation ? 'Mutation' : 'Query'})`);
  }
});

console.log('\n## Recommendations\n');
console.log('1. **Stripe Webhook Testing**: Add integration tests for Stripe webhook endpoint (`/payment/stripe`)\n');
console.log('2. **Web3 & WebAuthn**: Expand test coverage for Web3 and WebAuthn authentication flows\n');
console.log('3. **Product Lifecycle**: Add tests for product publishing/unpublishing workflows\n');
console.log('4. **Assortment Management**: Create comprehensive tests for assortment CRUD operations\n');
console.log('5. **Filter Management**: Add tests for filter creation and management\n');
console.log('6. **Admin Operations**: Test admin-specific operations like user impersonation\n');
console.log('7. **Statistics & Analytics**: Add tests for statistics and analytics queries\n');
console.log('8. **Ticketing Endpoints**: Add integration tests for Apple Wallet, Google Wallet, and PDF printing endpoints\n');
