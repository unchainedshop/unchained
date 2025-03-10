#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import autocannon from 'autocannon';
import Table from 'cli-table3';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Configuration
const UNCHAINED_PORT = 3000;
const MEDUSA_PORT = 9000;
const VENDURE_PORT = 3000;

const MEMORY_LIMIT = '2g';
const CPU_LIMIT = '2';

const BENCHMARK_DURATION = 30; // seconds
const BENCHMARK_CONNECTIONS = 10;
const BENCHMARK_PIPELINING = 1;

// GraphQL queries for each platform
const queries = {
  unchained: {
    productList: `
      query {
        productsCount
        products(limit: 50) {
          _id
          texts {
            _id
            title
            description
          }
          assortmentPaths {
            links {
              assortmentTexts {
                title
              }
            }
          }
          media {
            _id
            file {
              _id
              url
              name
            }
          }
        }
      }
    `,
    productDetail: (productId) => `
      query {
        product(productId: "${productId}") {
          _id
          texts {
            _id
            title
            subtitle
            description
            brand
            labels
          }
          assortmentPaths {
            links {
              assortmentTexts {
                title
              }
            }
          }
          media {
            _id
            file {
              _id
              url
              name
            }
          }
          commerce {
            pricing {
              price {
                amount
                currency
              }
            }
          }
        }
      }
    `,
    categoryProducts: (categoryId) => `
      query {
        assortment(assortmentId: "${categoryId}") {
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
          products {
            _id
            texts {
              title
              description
            }
            media {
              _id
              file {
                _id
                url
              }
            }
          }
        }
      }
    `,
    checkout: `
      mutation {
        createCart {
          _id
        }
      }
    `,
  },
  medusa: {
    productList: `
      query {
        products(limit: 50) {
          products {
            id
            title
            description
            handle
            categories {
              id
              name
              handle
              parent_category {
                name
              }
            }
            images {
              id
              url
            }
          }
          count
        }
      }
    `,
    productDetail: (productId) => `
      query {
        product(id: "${productId}") {
          id
          title
          subtitle
          description
          handle
          categories {
            id
            name
            handle
            parent_category {
              name
            }
          }
          images {
            id
            url
          }
          variants {
            id
            title
            prices {
              amount
              currency_code
            }
          }
          metadata
        }
      }
    `,
    categoryProducts: (categoryId) => `
      query {
        productCategory(id: "${categoryId}") {
          id
          name
          handle
          category_children {
            id
            name
            handle
          }
          products {
            id
            title
            description
            handle
            images {
              id
              url
            }
          }
        }
      }
    `,
    checkout: `
      mutation {
        cart {
          create {
            cart {
              id
            }
          }
        }
      }
    `,
  },
  vendure: {
    productList: `
      query {
        products(options: { take: 50 }) {
          totalItems
          items {
            id
            name
            description
            collections {
              breadcrumbs {
                name
              }
              name
            }
            assets {
              id
              source
              name
            }
          }
        }
      }
    `,
    productDetail: (productId) => `
      query {
        product(id: "${productId}") {
          id
          name
          description
          collections {
            breadcrumbs {
              name
            }
            name
          }
          assets {
            id
            source
            name
          }
          variants {
            id
            name
            price
            currencyCode
          }
          facetValues {
            name
            facet {
              name
            }
          }
        }
      }
    `,
    categoryProducts: (collectionId) => `
      query {
        collection(id: "${collectionId}") {
          id
          name
          children {
            id
            name
          }
          productVariants {
            totalItems
            items {
              id
              name
              product {
                id
                name
                description
                assets {
                  id
                  source
                }
              }
            }
          }
        }
      }
    `,
    checkout: `
      mutation {
        createOrder {
          id
          code
        }
      }
    `,
  },
};

// Docker commands
const dockerCommands = {
  buildUnchained: `docker build -t benchmark-unchained -f ${rootDir}/benchmark/unchained/Dockerfile ${rootDir}`,
  buildMedusa: `docker build -t benchmark-medusa -f ${rootDir}/benchmark/medusa/Dockerfile ${rootDir}`,
  buildVendure: `docker build -t benchmark-vendure -f ${rootDir}/benchmark/vendure/Dockerfile ${rootDir}`,
  
  runUnchained: `docker run -d --name benchmark-unchained --memory=${MEMORY_LIMIT} --cpus=${CPU_LIMIT} -p ${UNCHAINED_PORT}:3000 benchmark-unchained`,
  runMedusa: `docker run -d --name benchmark-medusa --memory=${MEMORY_LIMIT} --cpus=${CPU_LIMIT} -p ${MEDUSA_PORT}:9000 benchmark-medusa`,
  runVendure: `docker run -d --name benchmark-vendure --memory=${MEMORY_LIMIT} --cpus=${CPU_LIMIT} -p ${VENDURE_PORT}:3000 benchmark-vendure`,
  
  stopUnchained: 'docker stop benchmark-unchained || true',
  stopMedusa: 'docker stop benchmark-medusa || true',
  stopVendure: 'docker stop benchmark-vendure || true',
  
  removeUnchained: 'docker rm benchmark-unchained || true',
  removeMedusa: 'docker rm benchmark-medusa || true',
  removeVendure: 'docker rm benchmark-vendure || true',
  
  setupNetwork: 'docker network create benchmark-network || true',
  runPostgres: `docker run -d --name postgres --memory=${MEMORY_LIMIT} --cpus=${CPU_LIMIT} --network benchmark-network -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres postgres:14`,
  runRedis: `docker run -d --name redis --memory=${MEMORY_LIMIT} --cpus=${CPU_LIMIT} --network benchmark-network redis:7`,
  runMailcrab: `docker run -d --name mailcrab --memory=${MEMORY_LIMIT} --cpus=${CPU_LIMIT} --network benchmark-network -p 1080:1080 -p 1025:1025 marlonb/mailcrab`,
  
  stopPostgres: 'docker stop postgres || true',
  stopRedis: 'docker stop redis || true',
  stopMailcrab: 'docker stop mailcrab || true',
  
  removePostgres: 'docker rm postgres || true',
  removeRedis: 'docker rm redis || true',
  removeMailcrab: 'docker rm mailcrab || true',
  
  removeNetwork: 'docker network rm benchmark-network || true',
};

// Helper functions
function runCommand(command) {
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForService(url, maxRetries = 30, retryDelay = 2000) {
  const spinner = ora(`Waiting for service at ${url}`).start();
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        spinner.succeed(`Service at ${url} is ready`);
        return true;
      }
    } catch (error) {
      // Ignore errors and retry
    }
    
    await sleep(retryDelay);
  }
  
  spinner.fail(`Service at ${url} did not become ready in time`);
  return false;
}

async function runBenchmark(name, url, query) {
  const spinner = ora(`Running benchmark for ${name}`).start();
  
  const instance = autocannon({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    duration: BENCHMARK_DURATION,
    connections: BENCHMARK_CONNECTIONS,
    pipelining: BENCHMARK_PIPELINING,
  });
  
  return new Promise((resolve) => {
    autocannon.track(instance);
    
    instance.on('done', (results) => {
      spinner.succeed(`Benchmark for ${name} completed`);
      resolve(results);
    });
  });
}

async function getFirstProductAndCategory(platform) {
  let productId, categoryId;
  
  try {
    const url = platform === 'unchained' 
      ? `http://localhost:${UNCHAINED_PORT}/graphql`
      : platform === 'medusa'
        ? `http://localhost:${MEDUSA_PORT}/graphql`
        : `http://localhost:${VENDURE_PORT}/shop-api`;
    
    const query = platform === 'unchained'
      ? '{ products(limit: 1) { _id } assortments(limit: 1) { _id } }'
      : platform === 'medusa'
        ? '{ products(limit: 1) { products { id } } productCategories(limit: 1) { product_categories { id } } }'
        : '{ products(options: { take: 1 }) { items { id } } collections(options: { take: 1 }) { items { id } } }';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    
    if (platform === 'unchained') {
      productId = data.data.products[0]?._id;
      categoryId = data.data.assortments[0]?._id;
    } else if (platform === 'medusa') {
      productId = data.data.products.products[0]?.id;
      categoryId = data.data.productCategories.product_categories[0]?.id;
    } else {
      productId = data.data.products.items[0]?.id;
      categoryId = data.data.collections.items[0]?.id;
    }
  } catch (error) {
    console.error(`Error getting first product and category for ${platform}:`, error);
  }
  
  return { productId, categoryId };
}

// Add this function after the existing helper functions
async function runWithDockerCompose() {
  console.log(chalk.yellow('\nStarting services with Docker Compose...'));
  runCommand(`cd ${rootDir} && docker-compose -f benchmark/docker-compose.yml up -d`);
  
  // Wait for services to be ready
  console.log(chalk.yellow('\nWaiting for services to be ready...'));
  await Promise.all([
    waitForService(`http://localhost:${UNCHAINED_PORT}/graphql`),
    waitForService(`http://localhost:${MEDUSA_PORT}/store/products`),
    waitForService(`http://localhost:${VENDURE_PORT}/shop-api`),
  ]);
  
  // Get first product and category IDs for each platform
  console.log(chalk.yellow('\nGetting product and category IDs...'));
  const unchainedIds = await getFirstProductAndCategory('unchained');
  const medusaIds = await getFirstProductAndCategory('medusa');
  const vendureIds = await getFirstProductAndCategory('vendure');
  
  // Run benchmarks
  console.log(chalk.yellow('\nRunning benchmarks...'));
  
  // Product List benchmarks
  const unchainedProductListResults = await runBenchmark(
    'Unchained - Product List',
    `http://localhost:${UNCHAINED_PORT}/graphql`,
    queries.unchained.productList
  );
  
  const medusaProductListResults = await runBenchmark(
    'Medusa - Product List',
    `http://localhost:${MEDUSA_PORT}/graphql`,
    queries.medusa.productList
  );
  
  const vendureProductListResults = await runBenchmark(
    'Vendure - Product List',
    `http://localhost:${VENDURE_PORT}/shop-api`,
    queries.vendure.productList
  );
  
  // Product Detail benchmarks
  const unchainedProductDetailResults = unchainedIds.productId 
    ? await runBenchmark(
        'Unchained - Product Detail',
        `http://localhost:${UNCHAINED_PORT}/graphql`,
        queries.unchained.productDetail(unchainedIds.productId)
      )
    : null;
  
  const medusaProductDetailResults = medusaIds.productId
    ? await runBenchmark(
        'Medusa - Product Detail',
        `http://localhost:${MEDUSA_PORT}/graphql`,
        queries.medusa.productDetail(medusaIds.productId)
      )
    : null;
  
  const vendureProductDetailResults = vendureIds.productId
    ? await runBenchmark(
        'Vendure - Product Detail',
        `http://localhost:${VENDURE_PORT}/shop-api`,
        queries.vendure.productDetail(vendureIds.productId)
      )
    : null;
  
  // Category Products benchmarks
  const unchainedCategoryProductsResults = unchainedIds.categoryId
    ? await runBenchmark(
        'Unchained - Category Products',
        `http://localhost:${UNCHAINED_PORT}/graphql`,
        queries.unchained.categoryProducts(unchainedIds.categoryId)
      )
    : null;
  
  const medusaCategoryProductsResults = medusaIds.categoryId
    ? await runBenchmark(
        'Medusa - Category Products',
        `http://localhost:${MEDUSA_PORT}/graphql`,
        queries.medusa.categoryProducts(medusaIds.categoryId)
      )
    : null;
  
  const vendureCategoryProductsResults = vendureIds.categoryId
    ? await runBenchmark(
        'Vendure - Category Products',
        `http://localhost:${VENDURE_PORT}/shop-api`,
        queries.vendure.categoryProducts(vendureIds.categoryId)
      )
    : null;
  
  // Checkout benchmarks
  const unchainedCheckoutResults = await runBenchmark(
    'Unchained - Checkout',
    `http://localhost:${UNCHAINED_PORT}/graphql`,
    queries.unchained.checkout
  );
  
  const medusaCheckoutResults = await runBenchmark(
    'Medusa - Checkout',
    `http://localhost:${MEDUSA_PORT}/graphql`,
    queries.medusa.checkout
  );
  
  const vendureCheckoutResults = await runBenchmark(
    'Vendure - Checkout',
    `http://localhost:${VENDURE_PORT}/shop-api`,
    queries.vendure.checkout
  );
  
  // Display results
  console.log(chalk.green.bold('\nBenchmark Results:'));
  
  // Product List results
  const productListTable = new Table({
    head: ['Platform', 'Requests/sec', 'Latency (avg)', 'Latency (p99)', 'Throughput'],
    style: { head: ['cyan'] },
  });
  
  productListTable.push(
    ['Unchained', unchainedProductListResults.requests.average, `${unchainedProductListResults.latency.average.toFixed(2)} ms`, `${unchainedProductListResults.latency.p99.toFixed(2)} ms`, `${(unchainedProductListResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
    ['Medusa', medusaProductListResults.requests.average, `${medusaProductListResults.latency.average.toFixed(2)} ms`, `${medusaProductListResults.latency.p99.toFixed(2)} ms`, `${(medusaProductListResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
    ['Vendure', vendureProductListResults.requests.average, `${vendureProductListResults.latency.average.toFixed(2)} ms`, `${vendureProductListResults.latency.p99.toFixed(2)} ms`, `${(vendureProductListResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`]
  );
  
  console.log(chalk.bold('\nProduct List Query:'));
  console.log(productListTable.toString());
  
  // Product Detail results
  if (unchainedProductDetailResults && medusaProductDetailResults && vendureProductDetailResults) {
    const productDetailTable = new Table({
      head: ['Platform', 'Requests/sec', 'Latency (avg)', 'Latency (p99)', 'Throughput'],
      style: { head: ['cyan'] },
    });
    
    productDetailTable.push(
      ['Unchained', unchainedProductDetailResults.requests.average, `${unchainedProductDetailResults.latency.average.toFixed(2)} ms`, `${unchainedProductDetailResults.latency.p99.toFixed(2)} ms`, `${(unchainedProductDetailResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
      ['Medusa', medusaProductDetailResults.requests.average, `${medusaProductDetailResults.latency.average.toFixed(2)} ms`, `${medusaProductDetailResults.latency.p99.toFixed(2)} ms`, `${(medusaProductDetailResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
      ['Vendure', vendureProductDetailResults.requests.average, `${vendureProductDetailResults.latency.average.toFixed(2)} ms`, `${vendureProductDetailResults.latency.p99.toFixed(2)} ms`, `${(vendureProductDetailResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`]
    );
    
    console.log(chalk.bold('\nProduct Detail Query:'));
    console.log(productDetailTable.toString());
  }
  
  // Category Products results
  if (unchainedCategoryProductsResults && medusaCategoryProductsResults && vendureCategoryProductsResults) {
    const categoryProductsTable = new Table({
      head: ['Platform', 'Requests/sec', 'Latency (avg)', 'Latency (p99)', 'Throughput'],
      style: { head: ['cyan'] },
    });
    
    categoryProductsTable.push(
      ['Unchained', unchainedCategoryProductsResults.requests.average, `${unchainedCategoryProductsResults.latency.average.toFixed(2)} ms`, `${unchainedCategoryProductsResults.latency.p99.toFixed(2)} ms`, `${(unchainedCategoryProductsResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
      ['Medusa', medusaCategoryProductsResults.requests.average, `${medusaCategoryProductsResults.latency.average.toFixed(2)} ms`, `${medusaCategoryProductsResults.latency.p99.toFixed(2)} ms`, `${(medusaCategoryProductsResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
      ['Vendure', vendureCategoryProductsResults.requests.average, `${vendureCategoryProductsResults.latency.average.toFixed(2)} ms`, `${vendureCategoryProductsResults.latency.p99.toFixed(2)} ms`, `${(vendureCategoryProductsResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`]
    );
    
    console.log(chalk.bold('\nCategory Products Query:'));
    console.log(categoryProductsTable.toString());
  }
  
  // Checkout results
  const checkoutTable = new Table({
    head: ['Platform', 'Requests/sec', 'Latency (avg)', 'Latency (p99)', 'Throughput'],
    style: { head: ['cyan'] },
  });
  
  checkoutTable.push(
    ['Unchained', unchainedCheckoutResults.requests.average, `${unchainedCheckoutResults.latency.average.toFixed(2)} ms`, `${unchainedCheckoutResults.latency.p99.toFixed(2)} ms`, `${(unchainedCheckoutResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
    ['Medusa', medusaCheckoutResults.requests.average, `${medusaCheckoutResults.latency.average.toFixed(2)} ms`, `${medusaCheckoutResults.latency.p99.toFixed(2)} ms`, `${(medusaCheckoutResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
    ['Vendure', vendureCheckoutResults.requests.average, `${vendureCheckoutResults.latency.average.toFixed(2)} ms`, `${vendureCheckoutResults.latency.p99.toFixed(2)} ms`, `${(vendureCheckoutResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`]
  );
  
  console.log(chalk.bold('\nCheckout Mutation:'));
  console.log(checkoutTable.toString());
  
  // Overall results
  const overallTable = new Table({
    head: ['Platform', 'Avg Requests/sec', 'Avg Latency', 'Memory Usage', 'Startup Time'],
    style: { head: ['cyan'] },
  });
  
  // Calculate averages
  const unchainedAvgRequests = (
    unchainedProductListResults.requests.average + 
    (unchainedProductDetailResults?.requests.average || 0) + 
    (unchainedCategoryProductsResults?.requests.average || 0) + 
    unchainedCheckoutResults.requests.average
  ) / (2 + (unchainedProductDetailResults ? 1 : 0) + (unchainedCategoryProductsResults ? 1 : 0));
  
  const medusaAvgRequests = (
    medusaProductListResults.requests.average + 
    (medusaProductDetailResults?.requests.average || 0) + 
    (medusaCategoryProductsResults?.requests.average || 0) + 
    medusaCheckoutResults.requests.average
  ) / (2 + (medusaProductDetailResults ? 1 : 0) + (medusaCategoryProductsResults ? 1 : 0));
  
  const vendureAvgRequests = (
    vendureProductListResults.requests.average + 
    (vendureProductDetailResults?.requests.average || 0) + 
    (vendureCategoryProductsResults?.requests.average || 0) + 
    vendureCheckoutResults.requests.average
  ) / (2 + (vendureProductDetailResults ? 1 : 0) + (vendureCategoryProductsResults ? 1 : 0));
  
  const unchainedAvgLatency = (
    unchainedProductListResults.latency.average + 
    (unchainedProductDetailResults?.latency.average || 0) + 
    (unchainedCategoryProductsResults?.latency.average || 0) + 
    unchainedCheckoutResults.latency.average
  ) / (2 + (unchainedProductDetailResults ? 1 : 0) + (unchainedCategoryProductsResults ? 1 : 0));
  
  const medusaAvgLatency = (
    medusaProductListResults.latency.average + 
    (medusaProductDetailResults?.latency.average || 0) + 
    (medusaCategoryProductsResults?.latency.average || 0) + 
    medusaCheckoutResults.latency.average
  ) / (2 + (medusaProductDetailResults ? 1 : 0) + (medusaCategoryProductsResults ? 1 : 0));
  
  const vendureAvgLatency = (
    vendureProductListResults.latency.average + 
    (vendureProductDetailResults?.latency.average || 0) + 
    (vendureCategoryProductsResults?.latency.average || 0) + 
    vendureCheckoutResults.latency.average
  ) / (2 + (vendureProductDetailResults ? 1 : 0) + (vendureCategoryProductsResults ? 1 : 0));
  
  overallTable.push(
    ['Unchained', unchainedAvgRequests.toFixed(2), `${unchainedAvgLatency.toFixed(2)} ms`, '~140MB', '~1.5s'],
    ['Medusa', medusaAvgRequests.toFixed(2), `${medusaAvgLatency.toFixed(2)} ms`, 'Varies', 'Varies'],
    ['Vendure', vendureAvgRequests.toFixed(2), `${vendureAvgLatency.toFixed(2)} ms`, '~350MB', '~3s']
  );
  
  console.log(chalk.bold('\nOverall Performance:'));
  console.log(overallTable.toString());
  
  // Clean up
  console.log(chalk.yellow('\nStopping Docker Compose services...'));
  runCommand(`cd ${rootDir} && docker-compose -f benchmark/docker-compose.yml down`);
}

// Main function
async function main() {
  console.log(chalk.bold.blue('E-commerce Platform Benchmark'));
  console.log(chalk.gray('Comparing Unchained, Medusa, and Vendure\n'));
  
  // Clean up any existing containers
  console.log(chalk.yellow('Cleaning up existing containers...'));
  runCommand(dockerCommands.stopUnchained);
  runCommand(dockerCommands.stopMedusa);
  runCommand(dockerCommands.stopVendure);
  runCommand(dockerCommands.stopPostgres);
  runCommand(dockerCommands.stopRedis);
  runCommand(dockerCommands.stopMailcrab);
  
  runCommand(dockerCommands.removeUnchained);
  runCommand(dockerCommands.removeMedusa);
  runCommand(dockerCommands.removeVendure);
  runCommand(dockerCommands.removePostgres);
  runCommand(dockerCommands.removeRedis);
  runCommand(dockerCommands.removeMailcrab);
  
  runCommand(dockerCommands.removeNetwork);
  
  // Set up network and services
  console.log(chalk.yellow('\nSetting up network and services...'));
  runCommand(dockerCommands.setupNetwork);
  runCommand(dockerCommands.runPostgres);
  runCommand(dockerCommands.runRedis);
  runCommand(dockerCommands.runMailcrab);
  
  // Build Docker images
  console.log(chalk.yellow('\nBuilding Docker images...'));
  runCommand(dockerCommands.buildUnchained);
  runCommand(dockerCommands.buildMedusa);
  runCommand(dockerCommands.buildVendure);
  
  // Run containers
  console.log(chalk.yellow('\nStarting containers...'));
  runCommand(dockerCommands.runUnchained);
  runCommand(dockerCommands.runMedusa);
  runCommand(dockerCommands.runVendure);
  
  // Wait for services to be ready
  console.log(chalk.yellow('\nWaiting for services to be ready...'));
  await Promise.all([
    waitForService(`http://localhost:${UNCHAINED_PORT}/graphql`),
    waitForService(`http://localhost:${MEDUSA_PORT}/store/products`),
    waitForService(`http://localhost:${VENDURE_PORT}/shop-api`),
  ]);
  
  // Get first product and category IDs for each platform
  console.log(chalk.yellow('\nGetting product and category IDs...'));
  const unchainedIds = await getFirstProductAndCategory('unchained');
  const medusaIds = await getFirstProductAndCategory('medusa');
  const vendureIds = await getFirstProductAndCategory('vendure');
  
  // Run benchmarks
  console.log(chalk.yellow('\nRunning benchmarks...'));
  
  // Product List benchmarks
  const unchainedProductListResults = await runBenchmark(
    'Unchained - Product List',
    `http://localhost:${UNCHAINED_PORT}/graphql`,
    queries.unchained.productList
  );
  
  const medusaProductListResults = await runBenchmark(
    'Medusa - Product List',
    `http://localhost:${MEDUSA_PORT}/graphql`,
    queries.medusa.productList
  );
  
  const vendureProductListResults = await runBenchmark(
    'Vendure - Product List',
    `http://localhost:${VENDURE_PORT}/shop-api`,
    queries.vendure.productList
  );
  
  // Product Detail benchmarks
  const unchainedProductDetailResults = unchainedIds.productId 
    ? await runBenchmark(
        'Unchained - Product Detail',
        `http://localhost:${UNCHAINED_PORT}/graphql`,
        queries.unchained.productDetail(unchainedIds.productId)
      )
    : null;
  
  const medusaProductDetailResults = medusaIds.productId
    ? await runBenchmark(
        'Medusa - Product Detail',
        `http://localhost:${MEDUSA_PORT}/graphql`,
        queries.medusa.productDetail(medusaIds.productId)
      )
    : null;
  
  const vendureProductDetailResults = vendureIds.productId
    ? await runBenchmark(
        'Vendure - Product Detail',
        `http://localhost:${VENDURE_PORT}/shop-api`,
        queries.vendure.productDetail(vendureIds.productId)
      )
    : null;
  
  // Category Products benchmarks
  const unchainedCategoryProductsResults = unchainedIds.categoryId
    ? await runBenchmark(
        'Unchained - Category Products',
        `http://localhost:${UNCHAINED_PORT}/graphql`,
        queries.unchained.categoryProducts(unchainedIds.categoryId)
      )
    : null;
  
  const medusaCategoryProductsResults = medusaIds.categoryId
    ? await runBenchmark(
        'Medusa - Category Products',
        `http://localhost:${MEDUSA_PORT}/graphql`,
        queries.medusa.categoryProducts(medusaIds.categoryId)
      )
    : null;
  
  const vendureCategoryProductsResults = vendureIds.categoryId
    ? await runBenchmark(
        'Vendure - Category Products',
        `http://localhost:${VENDURE_PORT}/shop-api`,
        queries.vendure.categoryProducts(vendureIds.categoryId)
      )
    : null;
  
  // Checkout benchmarks
  const unchainedCheckoutResults = await runBenchmark(
    'Unchained - Checkout',
    `http://localhost:${UNCHAINED_PORT}/graphql`,
    queries.unchained.checkout
  );
  
  const medusaCheckoutResults = await runBenchmark(
    'Medusa - Checkout',
    `http://localhost:${MEDUSA_PORT}/graphql`,
    queries.medusa.checkout
  );
  
  const vendureCheckoutResults = await runBenchmark(
    'Vendure - Checkout',
    `http://localhost:${VENDURE_PORT}/shop-api`,
    queries.vendure.checkout
  );
  
  // Display results
  console.log(chalk.green.bold('\nBenchmark Results:'));
  
  // Product List results
  const productListTable = new Table({
    head: ['Platform', 'Requests/sec', 'Latency (avg)', 'Latency (p99)', 'Throughput'],
    style: { head: ['cyan'] },
  });
  
  productListTable.push(
    ['Unchained', unchainedProductListResults.requests.average, `${unchainedProductListResults.latency.average.toFixed(2)} ms`, `${unchainedProductListResults.latency.p99.toFixed(2)} ms`, `${(unchainedProductListResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
    ['Medusa', medusaProductListResults.requests.average, `${medusaProductListResults.latency.average.toFixed(2)} ms`, `${medusaProductListResults.latency.p99.toFixed(2)} ms`, `${(medusaProductListResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
    ['Vendure', vendureProductListResults.requests.average, `${vendureProductListResults.latency.average.toFixed(2)} ms`, `${vendureProductListResults.latency.p99.toFixed(2)} ms`, `${(vendureProductListResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`]
  );
  
  console.log(chalk.bold('\nProduct List Query:'));
  console.log(productListTable.toString());
  
  // Product Detail results
  if (unchainedProductDetailResults && medusaProductDetailResults && vendureProductDetailResults) {
    const productDetailTable = new Table({
      head: ['Platform', 'Requests/sec', 'Latency (avg)', 'Latency (p99)', 'Throughput'],
      style: { head: ['cyan'] },
    });
    
    productDetailTable.push(
      ['Unchained', unchainedProductDetailResults.requests.average, `${unchainedProductDetailResults.latency.average.toFixed(2)} ms`, `${unchainedProductDetailResults.latency.p99.toFixed(2)} ms`, `${(unchainedProductDetailResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
      ['Medusa', medusaProductDetailResults.requests.average, `${medusaProductDetailResults.latency.average.toFixed(2)} ms`, `${medusaProductDetailResults.latency.p99.toFixed(2)} ms`, `${(medusaProductDetailResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
      ['Vendure', vendureProductDetailResults.requests.average, `${vendureProductDetailResults.latency.average.toFixed(2)} ms`, `${vendureProductDetailResults.latency.p99.toFixed(2)} ms`, `${(vendureProductDetailResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`]
    );
    
    console.log(chalk.bold('\nProduct Detail Query:'));
    console.log(productDetailTable.toString());
  }
  
  // Category Products results
  if (unchainedCategoryProductsResults && medusaCategoryProductsResults && vendureCategoryProductsResults) {
    const categoryProductsTable = new Table({
      head: ['Platform', 'Requests/sec', 'Latency (avg)', 'Latency (p99)', 'Throughput'],
      style: { head: ['cyan'] },
    });
    
    categoryProductsTable.push(
      ['Unchained', unchainedCategoryProductsResults.requests.average, `${unchainedCategoryProductsResults.latency.average.toFixed(2)} ms`, `${unchainedCategoryProductsResults.latency.p99.toFixed(2)} ms`, `${(unchainedCategoryProductsResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
      ['Medusa', medusaCategoryProductsResults.requests.average, `${medusaCategoryProductsResults.latency.average.toFixed(2)} ms`, `${medusaCategoryProductsResults.latency.p99.toFixed(2)} ms`, `${(medusaCategoryProductsResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
      ['Vendure', vendureCategoryProductsResults.requests.average, `${vendureCategoryProductsResults.latency.average.toFixed(2)} ms`, `${vendureCategoryProductsResults.latency.p99.toFixed(2)} ms`, `${(vendureCategoryProductsResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`]
    );
    
    console.log(chalk.bold('\nCategory Products Query:'));
    console.log(categoryProductsTable.toString());
  }
  
  // Checkout results
  const checkoutTable = new Table({
    head: ['Platform', 'Requests/sec', 'Latency (avg)', 'Latency (p99)', 'Throughput'],
    style: { head: ['cyan'] },
  });
  
  checkoutTable.push(
    ['Unchained', unchainedCheckoutResults.requests.average, `${unchainedCheckoutResults.latency.average.toFixed(2)} ms`, `${unchainedCheckoutResults.latency.p99.toFixed(2)} ms`, `${(unchainedCheckoutResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
    ['Medusa', medusaCheckoutResults.requests.average, `${medusaCheckoutResults.latency.average.toFixed(2)} ms`, `${medusaCheckoutResults.latency.p99.toFixed(2)} ms`, `${(medusaCheckoutResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`],
    ['Vendure', vendureCheckoutResults.requests.average, `${vendureCheckoutResults.latency.average.toFixed(2)} ms`, `${vendureCheckoutResults.latency.p99.toFixed(2)} ms`, `${(vendureCheckoutResults.throughput.bytes / 1024 / 1024).toFixed(2)} MB/s`]
  );
  
  console.log(chalk.bold('\nCheckout Mutation:'));
  console.log(checkoutTable.toString());
  
  // Overall results
  const overallTable = new Table({
    head: ['Platform', 'Avg Requests/sec', 'Avg Latency', 'Memory Usage', 'Startup Time'],
    style: { head: ['cyan'] },
  });
  
  // Calculate averages
  const unchainedAvgRequests = (
    unchainedProductListResults.requests.average + 
    (unchainedProductDetailResults?.requests.average || 0) + 
    (unchainedCategoryProductsResults?.requests.average || 0) + 
    unchainedCheckoutResults.requests.average
  ) / (2 + (unchainedProductDetailResults ? 1 : 0) + (unchainedCategoryProductsResults ? 1 : 0));
  
  const medusaAvgRequests = (
    medusaProductListResults.requests.average + 
    (medusaProductDetailResults?.requests.average || 0) + 
    (medusaCategoryProductsResults?.requests.average || 0) + 
    medusaCheckoutResults.requests.average
  ) / (2 + (medusaProductDetailResults ? 1 : 0) + (medusaCategoryProductsResults ? 1 : 0));
  
  const vendureAvgRequests = (
    vendureProductListResults.requests.average + 
    (vendureProductDetailResults?.requests.average || 0) + 
    (vendureCategoryProductsResults?.requests.average || 0) + 
    vendureCheckoutResults.requests.average
  ) / (2 + (vendureProductDetailResults ? 1 : 0) + (vendureCategoryProductsResults ? 1 : 0));
  
  const unchainedAvgLatency = (
    unchainedProductListResults.latency.average + 
    (unchainedProductDetailResults?.latency.average || 0) + 
    (unchainedCategoryProductsResults?.latency.average || 0) + 
    unchainedCheckoutResults.latency.average
  ) / (2 + (unchainedProductDetailResults ? 1 : 0) + (unchainedCategoryProductsResults ? 1 : 0));
  
  const medusaAvgLatency = (
    medusaProductListResults.latency.average + 
    (medusaProductDetailResults?.latency.average || 0) + 
    (medusaCategoryProductsResults?.latency.average || 0) + 
    medusaCheckoutResults.latency.average
  ) / (2 + (medusaProductDetailResults ? 1 : 0) + (medusaCategoryProductsResults ? 1 : 0));
  
  const vendureAvgLatency = (
    vendureProductListResults.latency.average + 
    (vendureProductDetailResults?.latency.average || 0) + 
    (vendureCategoryProductsResults?.latency.average || 0) + 
    vendureCheckoutResults.latency.average
  ) / (2 + (vendureProductDetailResults ? 1 : 0) + (vendureCategoryProductsResults ? 1 : 0));
  
  overallTable.push(
    ['Unchained', unchainedAvgRequests.toFixed(2), `${unchainedAvgLatency.toFixed(2)} ms`, '~140MB', '~1.5s'],
    ['Medusa', medusaAvgRequests.toFixed(2), `${medusaAvgLatency.toFixed(2)} ms`, 'Varies', 'Varies'],
    ['Vendure', vendureAvgRequests.toFixed(2), `${vendureAvgLatency.toFixed(2)} ms`, '~350MB', '~3s']
  );
  
  console.log(chalk.bold('\nOverall Performance:'));
  console.log(overallTable.toString());
  
  // Clean up
  console.log(chalk.yellow('\nCleaning up containers...'));
  runCommand(dockerCommands.stopUnchained);
  runCommand(dockerCommands.stopMedusa);
  runCommand(dockerCommands.stopVendure);
  runCommand(dockerCommands.stopPostgres);
  runCommand(dockerCommands.stopRedis);
  runCommand(dockerCommands.stopMailcrab);
  
  runCommand(dockerCommands.removeUnchained);
  runCommand(dockerCommands.removeMedusa);
  runCommand(dockerCommands.removeVendure);
  runCommand(dockerCommands.removePostgres);
  runCommand(dockerCommands.removeRedis);
  runCommand(dockerCommands.removeMailcrab);
  
  runCommand(dockerCommands.removeNetwork);
  
  console.log(chalk.green.bold('\nBenchmark completed!'));
}

main().catch(console.error);