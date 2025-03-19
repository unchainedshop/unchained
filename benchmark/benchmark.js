#!/usr/bin/env node

// E-commerce Platform Benchmark
// This script compares the performance of Medusa, Vendure, and Unchained

import fetch from 'node-fetch';
import autocannon from 'autocannon';
import { writeFileSync } from 'fs';

// Configuration for each vendor
const vendors = {
  vendure: {
    baseUrl: 'http://localhost:3001',
    shopApi: '/shop-api',
    adminApi: '/admin-api',
    auth: {
      shop: null, // Will be set after login
      admin: null, // Will be set after login
    },
  },
  medusa: {
    baseUrl: 'http://localhost:3002',
    shopApi: '/store',
    adminApi: '/admin',
    auth: {
      shop: null,
      admin: null,
    },
  },
  unchained: {
    baseUrl: 'http://localhost:3003',
    shopApi: '/graphql',
    adminApi: '/graphql',
    auth: {
      shop: null,
      admin: null,
    },
  },
};

// Test parameters
const TEST_DURATION = 30; // seconds
const CONNECTIONS = 10;
const PIPELINING = 1;

// Helper function to authenticate with each platform
async function authenticatePlatforms() {
  for (const [name, vendor] of Object.entries(vendors)) {
    try {
      switch (name) {
        case 'vendure':
          // Login to Vendure admin
          const vendureAdminLogin = await fetch(`${vendor.baseUrl}${vendor.adminApi}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'superadmin',
              password: 'superadmin123',
            }),
          });
          const vendureAdminToken = await vendureAdminLogin.json();
          vendor.auth.admin = vendureAdminToken.token;

          // Login to Vendure shop
          const vendureShopLogin = await fetch(`${vendor.baseUrl}${vendor.shopApi}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'test123',
            }),
          });
          const vendureShopToken = await vendureShopLogin.json();
          vendor.auth.shop = vendureShopToken.token;
          break;

        case 'medusa':
          // Login to Medusa admin
          const medusaAdminLogin = await fetch(`${vendor.baseUrl}${vendor.adminApi}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'admin@medusa-test.com',
              password: 'medusa',
            }),
          });
          const medusaAdminToken = await medusaAdminLogin.json();
          vendor.auth.admin = medusaAdminToken.token;

          // Login to Medusa store
          const medusaShopLogin = await fetch(`${vendor.baseUrl}${vendor.shopApi}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'customer@example.com',
              password: 'medusa',
            }),
          });
          const medusaShopToken = await medusaShopLogin.json();
          vendor.auth.shop = medusaShopToken.token;
          break;

        case 'unchained':
          // Login to Unchained admin
          const unchainedAdminLogin = await fetch(`${vendor.baseUrl}${vendor.adminApi}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                mutation {
                  loginAsUser(
                    email: "admin@unchained.local"
                    password: "admin"
                  ) {
                    token
                  }
                }
              `,
            }),
          });
          const unchainedAdminToken = await unchainedAdminLogin.json();
          vendor.auth.admin = unchainedAdminToken.data.loginAsUser.token;

          // Login to Unchained shop
          const unchainedShopLogin = await fetch(`${vendor.baseUrl}${vendor.shopApi}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                mutation {
                  loginAsUser(
                    email: "user@unchained.local"
                    password: "user"
                  ) {
                    token
                  }
                }
              `,
            }),
          });
          const unchainedShopToken = await unchainedShopLogin.json();
          vendor.auth.shop = unchainedShopToken.data.loginAsUser.token;
          break;
      }
    } catch (error) {
      console.error(`Error authenticating with ${name}:`, error);
    }
  }
}

// Test functions for each operation
async function testProductListing(vendor) {
  const headers = {
    'Authorization': `Bearer ${vendor.auth.shop}`,
    'Content-Type': 'application/json',
  };

  const result = await autocannon({
    url: `${vendor.baseUrl}${vendor.shopApi}/products`,
    connections: CONNECTIONS,
    duration: TEST_DURATION,
    pipelining: PIPELINING,
    headers,
  });

  return result;
}

async function testCategoryBrowsing(vendor) {
  const headers = {
    'Authorization': `Bearer ${vendor.auth.shop}`,
    'Content-Type': 'application/json',
  };

  const result = await autocannon({
    url: `${vendor.baseUrl}${vendor.shopApi}/collections`,
    connections: CONNECTIONS,
    duration: TEST_DURATION,
    pipelining: PIPELINING,
    headers,
  });

  return result;
}

async function testFacetedSearch(vendor) {
  const headers = {
    'Authorization': `Bearer ${vendor.auth.shop}`,
    'Content-Type': 'application/json',
  };

  const result = await autocannon({
    url: `${vendor.baseUrl}${vendor.shopApi}/products?filter=color:red`,
    connections: CONNECTIONS,
    duration: TEST_DURATION,
    pipelining: PIPELINING,
    headers,
  });

  return result;
}

async function testCheckout(vendor) {
  const headers = {
    'Authorization': `Bearer ${vendor.auth.shop}`,
    'Content-Type': 'application/json',
  };

  const result = await autocannon({
    url: `${vendor.baseUrl}${vendor.shopApi}/checkout`,
    connections: CONNECTIONS,
    duration: TEST_DURATION,
    pipelining: PIPELINING,
    headers,
  });

  return result;
}

// Helper function to save results
function saveResults(results) {
  writeFileSync('benchmark-results.json', JSON.stringify(results, null, 2));
}

// Helper function to verify servers are running
async function verifyServers() {
  for (const [name, vendor] of Object.entries(vendors)) {
    try {
      console.log(`Checking ${name} at ${vendor.baseUrl}...`);
      const response = await fetch(vendor.baseUrl);
      console.log(`${name} server status: ${response.status}`);
    } catch (error) {
      console.error(`Error checking ${name}:`, error);
    }
  }
}

// Main function to run all benchmarks
async function runBenchmarks() {
  console.log('Starting e-commerce platform benchmark...');
  
  await verifyServers();
  await authenticatePlatforms();

  const results = [];

  for (const [name, vendor] of Object.entries(vendors)) {
    console.log(`\n--- Testing ${name} ---\n`);

    console.log(`Testing product listing for ${name}...`);
    const productListingResult = await testProductListing(vendor);
    results.push({
      vendor: name,
      operation: 'Product Listing',
      result: productListingResult,
    });

    console.log(`Testing category browsing for ${name}...`);
    const categoryBrowsingResult = await testCategoryBrowsing(vendor);
    results.push({
      vendor: name,
      operation: 'Category Browsing',
      result: categoryBrowsingResult,
    });

    console.log(`Testing faceted search for ${name}...`);
    const facetedSearchResult = await testFacetedSearch(vendor);
    results.push({
      vendor: name,
      operation: 'Faceted Search',
      result: facetedSearchResult,
    });

    console.log(`Testing checkout for ${name}...`);
    const checkoutResult = await testCheckout(vendor);
    results.push({
      vendor: name,
      operation: 'Checkout',
      result: checkoutResult,
    });
  }

  saveResults(results);

  console.log('\n--- Benchmark Summary ---\n');
  for (const result of results) {
    console.log(`${result.vendor} - ${result.operation}:`);
    console.log(`  Requests/s: ${result.result.requests.average.toFixed(2)}`);
    console.log(`  Latency: ${result.result.latency.average.toFixed(2)} ms`);
    console.log(`  Throughput: ${(result.result.throughput.average / 1024).toFixed(2)} KB/s`);
  }

  console.log('\nBenchmark completed!');
}

runBenchmarks().catch(console.error); 