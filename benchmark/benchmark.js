#!/usr/bin/env node

// E-commerce Platform Benchmark
// This script compares the performance of Medusa, Vendure, and Unchained

import fetch from 'node-fetch';
import autocannon from 'autocannon';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const VENDORS = {
  VENDURE: {
    name: 'Vendure',
    baseUrl: 'http://localhost:3001',
    productEndpoint: '/shop-api',
    categoryEndpoint: '/shop-api',
    checkoutEndpoint: '/shop-api'
  },
  MEDUSA: {
    name: 'Medusa',
    baseUrl: 'http://localhost:3002',
    productEndpoint: '/store/products',
    categoryEndpoint: '/store/product-categories', 
    checkoutEndpoint: '/store/carts'
  },
  UNCHAINED: {
    name: 'Unchained',
    baseUrl: 'http://localhost:3003',
    productEndpoint: '/graphql',
    categoryEndpoint: '/graphql',
    checkoutEndpoint: '/graphql'
  }
};

// Test parameters
const DURATION = 30; // seconds
const CONNECTIONS = 10;
const PIPELINING = 1;

// Helper to run autocannon as a promise
const runAutocannon = promisify((opts, cb) => {
  autocannon(opts, (err, result) => {
    if (err) {
      cb(err);
    } else {
      cb(null, result);
    }
  });
});

// Function to test product listing performance
async function testProductListing(vendor) {
  console.log(`Testing product listing for ${vendor.name}...`);
  
  let endpoint, payload;
  
  // Prepare request based on vendor
  if (vendor.name === 'Vendure') {
    endpoint = `${vendor.baseUrl}${vendor.productEndpoint}`;
    payload = {
      query: `
        query GetProducts {
          products(options: { take: 20 }) {
            items {
              id
              name
              description
              variants {
                id
                name
                price
              }
            }
            totalItems
          }
        }
      `
    };
  } else if (vendor.name === 'Medusa') {
    endpoint = `${vendor.baseUrl}${vendor.productEndpoint}?limit=20`;
    payload = null; // GET request
  } else if (vendor.name === 'Unchained') {
    endpoint = `${vendor.baseUrl}${vendor.productEndpoint}`;
    payload = {
      query: `
        query {
          products(limit: 20) {
            _id
            texts {
              title
              subtitle
              description
            }
            catalogPrice {
              amount
              currency
            }
          }
        }
      `
    };
  }

  // Run benchmark
  try {
    const result = await runAutocannon({
      url: endpoint,
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload ? JSON.stringify(payload) : undefined,
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING
    });
    
    return {
      vendor: vendor.name,
      operation: 'Product Listing',
      result
    };
  } catch (error) {
    console.error(`Error testing ${vendor.name} product listing:`, error);
    return {
      vendor: vendor.name,
      operation: 'Product Listing',
      error: error.toString()
    };
  }
}

// Function to test category browsing performance
async function testCategoryBrowsing(vendor) {
  console.log(`Testing category browsing for ${vendor.name}...`);
  
  let endpoint, payload;
  
  // Prepare request based on vendor
  if (vendor.name === 'Vendure') {
    endpoint = `${vendor.baseUrl}${vendor.categoryEndpoint}`;
    payload = {
      query: `
        query GetCategories {
          collections {
            items {
              id
              name
              children {
                id
                name
              }
            }
            totalItems
          }
        }
      `
    };
  } else if (vendor.name === 'Medusa') {
    endpoint = `${vendor.baseUrl}${vendor.categoryEndpoint}`;
    payload = null; // GET request
  } else if (vendor.name === 'Unchained') {
    endpoint = `${vendor.baseUrl}${vendor.categoryEndpoint}`;
    payload = {
      query: `
        query {
          categories {
            _id
            texts {
              title
            }
            children {
              _id
              texts {
                title
              }
            }
          }
        }
      `
    };
  }

  // Run benchmark
  try {
    const result = await runAutocannon({
      url: endpoint,
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload ? JSON.stringify(payload) : undefined,
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING
    });
    
    return {
      vendor: vendor.name,
      operation: 'Category Browsing',
      result
    };
  } catch (error) {
    console.error(`Error testing ${vendor.name} category browsing:`, error);
    return {
      vendor: vendor.name,
      operation: 'Category Browsing',
      error: error.toString()
    };
  }
}

// Function to test faceted search performance
async function testFacetedSearch(vendor) {
  console.log(`Testing faceted search for ${vendor.name}...`);
  
  let endpoint, payload;
  
  // Prepare request based on vendor
  if (vendor.name === 'Vendure') {
    endpoint = `${vendor.baseUrl}${vendor.productEndpoint}`;
    payload = {
      query: `
        query FilterProducts {
          search(input: {
            term: "",
            facetValueFilters: [
              { facetValueId: "1" }, # Assuming facetValueId 1 is for color=red
              { facetValueId: "2" }  # Assuming facetValueId 2 is for size=5
            ]
          }) {
            items {
              productName
              productVariantId
              price {
                value
                currencyCode
              }
            }
            totalItems
            facetValues {
              count
              facetValue {
                id
                name
                facet {
                  name
                }
              }
            }
          }
        }
      `
    };
  } else if (vendor.name === 'Medusa') {
    endpoint = `${vendor.baseUrl}${vendor.productEndpoint}?color=red&size=5`;
    payload = null; // GET request
  } else if (vendor.name === 'Unchained') {
    endpoint = `${vendor.baseUrl}${vendor.productEndpoint}`;
    payload = {
      query: `
        query {
          products(
            filter: {
              color: "red",
              size: 5
            }
          ) {
            _id
            texts {
              title
            }
            catalogPrice {
              amount
              currency
            }
          }
        }
      `
    };
  }

  // Run benchmark
  try {
    const result = await runAutocannon({
      url: endpoint,
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload ? JSON.stringify(payload) : undefined,
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING
    });
    
    return {
      vendor: vendor.name,
      operation: 'Faceted Search',
      result
    };
  } catch (error) {
    console.error(`Error testing ${vendor.name} faceted search:`, error);
    return {
      vendor: vendor.name,
      operation: 'Faceted Search',
      error: error.toString()
    };
  }
}

// Function to test checkout performance
async function testCheckout(vendor) {
  console.log(`Testing checkout for ${vendor.name}...`);
  
  let endpoint, payload;
  
  // Prepare request based on vendor
  if (vendor.name === 'Vendure') {
    endpoint = `${vendor.baseUrl}${vendor.checkoutEndpoint}`;
    payload = {
      query: `
        mutation CreateOrder {
          addItemToOrder(productVariantId: "1", quantity: 1) {
            code
            state
            total
          }
          setOrderShippingAddress(input: {
            fullName: "Test User",
            streetLine1: "123 Test St",
            city: "Test City",
            postalCode: "12345",
            countryCode: "US"
          }) {
            code
          }
          setOrderBillingAddress(input: {
            fullName: "Test User",
            streetLine1: "123 Test St",
            city: "Test City",
            postalCode: "12345",
            countryCode: "US"
          }) {
            code
          }
          setOrderCustomerDetails(input: {
            emailAddress: "test@example.com",
            firstName: "Test",
            lastName: "User"
          }) {
            code
          }
          transitionOrderToState(state: "ArrangingPayment") {
            code
            state
          }
          addPaymentToOrder(input: {
            method: "invoice",
            metadata: {}
          }) {
            code
            state
            total
          }
        }
      `
    };
  } else if (vendor.name === 'Medusa') {
    // For Medusa, we would need multiple requests for a checkout flow
    // Simplified for benchmarking purposes
    endpoint = `${vendor.baseUrl}${vendor.checkoutEndpoint}`;
    payload = {
      items: [{ variant_id: "1", quantity: 1 }],
      email: "test@example.com",
      shipping_address: {
        first_name: "Test",
        last_name: "User",
        address_1: "123 Test St",
        city: "Test City",
        postal_code: "12345",
        country_code: "us"
      },
      billing_address: {
        first_name: "Test",
        last_name: "User",
        address_1: "123 Test St",
        city: "Test City",
        postal_code: "12345",
        country_code: "us"
      }
    };
  } else if (vendor.name === 'Unchained') {
    endpoint = `${vendor.baseUrl}${vendor.checkoutEndpoint}`;
    payload = {
      query: `
        mutation {
          createOrder(
            items: [{ productId: "1", quantity: 1 }]
            contact: {
              emailAddress: "test@example.com"
            }
            billingAddress: {
              firstName: "Test"
              lastName: "User"
              addressLine: "123 Test St"
              postalCode: "12345"
              city: "Test City"
              countryCode: "US"
            }
            paymentMethod: "INVOICE"
          ) {
            _id
            status
            total {
              amount
              currency
            }
          }
        }
      `
    };
  }

  // Run benchmark
  try {
    const result = await runAutocannon({
      url: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING
    });
    
    return {
      vendor: vendor.name,
      operation: 'Checkout',
      result
    };
  } catch (error) {
    console.error(`Error testing ${vendor.name} checkout:`, error);
    return {
      vendor: vendor.name,
      operation: 'Checkout',
      error: error.toString()
    };
  }
}

// Helper for saving results
async function saveResults(results) {
  try {
    const outputPath = join(__dirname, 'benchmark-results.json');
    await writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${outputPath}`);
  } catch (error) {
    console.error('Error saving results:', error);
  }
}

// Helper to verify servers are running
async function verifyServers() {
  console.log('Verifying servers are running...');
  
  for (const [key, vendor] of Object.entries(VENDORS)) {
    try {
      console.log(`Checking ${vendor.name} at ${vendor.baseUrl}...`);
      const response = await fetch(vendor.baseUrl, { method: 'GET' });
      console.log(`${vendor.name} server status: ${response.status}`);
    } catch (error) {
      console.error(`Error connecting to ${vendor.name} server:`, error.message);
      console.log(`Please make sure ${vendor.name} is running at ${vendor.baseUrl}`);
    }
  }
}

// Main function to run all benchmarks
async function runBenchmarks() {
  console.log('Starting e-commerce platform benchmark...');
  
  // First verify servers are running
  await verifyServers();
  
  const results = [];
  
  // Run tests for each vendor
  for (const [key, vendor] of Object.entries(VENDORS)) {
    console.log(`\n--- Testing ${vendor.name} ---\n`);
    
    // Test product listing
    results.push(await testProductListing(vendor));
    
    // Test category browsing
    results.push(await testCategoryBrowsing(vendor));
    
    // Test faceted search
    results.push(await testFacetedSearch(vendor));
    
    // Test checkout
    results.push(await testCheckout(vendor));
  }
  
  // Save and print results
  await saveResults(results);
  
  // Print a summary
  console.log('\n--- Benchmark Summary ---\n');
  for (const result of results) {
    if (result.error) {
      console.log(`${result.vendor} - ${result.operation}: ERROR - ${result.error}`);
    } else {
      console.log(`${result.vendor} - ${result.operation}:`);
      console.log(`  Requests/s: ${result.result.requests.average}`);
      console.log(`  Latency: ${result.result.latency.average} ms`);
      console.log(`  Throughput: ${Math.round(result.result.throughput.average / 1024)} KB/s`);
    }
  }
  
  console.log('\nBenchmark completed!');
}

// Run the benchmarks
runBenchmarks().catch(error => {
  console.error('Benchmark error:', error);
  process.exit(1);
}); 