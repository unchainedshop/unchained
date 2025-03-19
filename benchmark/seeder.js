#!/usr/bin/env node

// E-commerce Platform Seeder
// This script populates Medusa, Vendure, and Unchained with test data

import fetch from 'node-fetch';
import { faker } from '@faker-js/faker';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for each vendor
const vendors = {
  vendure: {
    baseUrl: 'http://localhost:3001',
    shopApi: '/shop-api',
    adminApi: '/admin-api',
    auth: {
      admin: null,
    },
  },
  medusa: {
    baseUrl: 'http://localhost:3002',
    shopApi: '/store',
    adminApi: '/admin',
    auth: {
      admin: null,
    },
  },
  unchained: {
    baseUrl: 'http://localhost:3003',
    shopApi: '/graphql',
    adminApi: '/graphql',
    auth: {
      admin: null,
    },
  },
};

// Constants for data setup
const NUM_PRODUCTS = 20000;
const CURRENCIES = ['USD', 'CHF'];
const COLORS = ['red', 'blue', 'green', 'yellow', 'black', 'white'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Category structure
const CATEGORY_STRUCTURE = {
  rootCategories: 5,
  subCategoriesPerRoot: 10,
  subSubCategoriesPerSub: 10,
};

// Helper function to create random product data
function createRandomProduct() {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.int({ min: 1000, max: 10000 }),
    currency: faker.helpers.arrayElement(CURRENCIES),
    color: faker.helpers.arrayElement(COLORS),
    size: faker.helpers.arrayElement(SIZES),
    images: Array(faker.number.int({ min: 1, max: 3 }))
      .fill(null)
      .map(() => faker.image.url()),
    metadata: {
      brand: faker.company.name(),
      tags: faker.helpers.multiple(() => faker.word.sample(), { count: 3 }),
      labels: faker.helpers.multiple(() => faker.word.sample(), { count: 2 }),
    },
  };
}

// Helper function to build category structure
function buildCategoryStructure() {
  const categories = [];
  for (let i = 0; i < CATEGORY_STRUCTURE.rootCategories; i++) {
    const rootCategory = {
      name: faker.commerce.department(),
      subCategories: [],
    };
    for (let j = 0; j < CATEGORY_STRUCTURE.subCategoriesPerRoot; j++) {
      const subCategory = {
        name: faker.commerce.department(),
        subCategories: [],
      };
      for (let k = 0; k < CATEGORY_STRUCTURE.subSubCategoriesPerSub; k++) {
        subCategory.subCategories.push({
          name: faker.commerce.department(),
        });
      }
      rootCategory.subCategories.push(subCategory);
    }
    categories.push(rootCategory);
  }
  return categories;
}

// Helper function to distribute products across categories
function distributeProducts(products, categories) {
  const productsPerLeaf = Math.floor(products.length / (categories.length * CATEGORY_STRUCTURE.subCategoriesPerRoot * CATEGORY_STRUCTURE.subSubCategoriesPerSub));
  const distribution = [];
  
  categories.forEach(root => {
    root.subCategories.forEach(sub => {
      sub.subCategories.forEach(leaf => {
        const categoryProducts = products.splice(0, productsPerLeaf);
        distribution.push({
          category: `${root.name} > ${sub.name} > ${leaf.name}`,
          products: categoryProducts,
        });
      });
    });
  });

  return distribution;
}

// Platform-specific seeding functions
async function seedVendure(products, categories) {
  const headers = {
    'Authorization': `Bearer ${vendors.vendure.auth.admin}`,
    'Content-Type': 'application/json',
  };

  // Create categories
  for (const root of categories) {
    const rootCategory = await fetch(`${vendors.vendure.baseUrl}${vendors.vendure.adminApi}/taxonomies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: root.name,
        code: root.name.toLowerCase().replace(/\s+/g, '-'),
      }),
    });

    for (const sub of root.subCategories) {
      const subCategory = await fetch(`${vendors.vendure.baseUrl}${vendors.vendure.adminApi}/taxonomies/${rootCategory.id}/terms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: sub.name,
          code: sub.name.toLowerCase().replace(/\s+/g, '-'),
        }),
      });

      for (const leaf of sub.subCategories) {
        await fetch(`${vendors.vendure.baseUrl}${vendors.vendure.adminApi}/taxonomies/${rootCategory.id}/terms/${subCategory.id}/terms`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: leaf.name,
            code: leaf.name.toLowerCase().replace(/\s+/g, '-'),
          }),
        });
      }
    }
  }

  // Create products
  for (const product of products) {
    await fetch(`${vendors.vendure.baseUrl}${vendors.vendure.adminApi}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: product.name,
        description: product.description,
        slug: product.name.toLowerCase().replace(/\s+/g, '-'),
        variants: [{
          name: 'Default',
          price: product.price,
          currency: product.currency,
          options: [{
            code: 'color',
            value: product.color,
          }, {
            code: 'size',
            value: product.size,
          }],
        }],
        assets: product.images.map(url => ({
          source: url,
        })),
        customFields: product.metadata,
      }),
    });
  }
}

async function seedMedusa(products, categories) {
  const headers = {
    'Authorization': `Bearer ${vendors.medusa.auth.admin}`,
    'Content-Type': 'application/json',
  };

  // Create categories
  for (const root of categories) {
    const rootCategory = await fetch(`${vendors.medusa.baseUrl}${vendors.medusa.adminApi}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: root.name,
        handle: root.name.toLowerCase().replace(/\s+/g, '-'),
      }),
    });

    for (const sub of root.subCategories) {
      const subCategory = await fetch(`${vendors.medusa.baseUrl}${vendors.medusa.adminApi}/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: sub.name,
          handle: sub.name.toLowerCase().replace(/\s+/g, '-'),
          parent_id: rootCategory.id,
        }),
      });

      for (const leaf of sub.subCategories) {
        await fetch(`${vendors.medusa.baseUrl}${vendors.medusa.adminApi}/collections`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: leaf.name,
            handle: leaf.name.toLowerCase().replace(/\s+/g, '-'),
            parent_id: subCategory.id,
          }),
        });
      }
    }
  }

  // Create products
  for (const product of products) {
    await fetch(`${vendors.medusa.baseUrl}${vendors.medusa.adminApi}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: product.name,
        description: product.description,
        handle: product.name.toLowerCase().replace(/\s+/g, '-'),
        status: 'published',
        variants: [{
          title: 'Default',
          prices: [{
            amount: product.price,
            currency_code: product.currency.toLowerCase(),
          }],
          options: [{
            title: 'Color',
            values: [product.color],
          }, {
            title: 'Size',
            values: [product.size],
          }],
        }],
        images: product.images.map(url => ({
          url,
        })),
        metadata: product.metadata,
      }),
    });
  }
}

async function seedUnchained(products, categories) {
  const headers = {
    'Authorization': `Bearer ${vendors.unchained.auth.admin}`,
    'Content-Type': 'application/json',
  };

  // Create categories
  for (const root of categories) {
    const rootCategory = await fetch(`${vendors.unchained.baseUrl}${vendors.unchained.adminApi}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          mutation {
            createCategory(
              name: "${root.name}"
              slug: "${root.name.toLowerCase().replace(/\s+/g, '-')}"
            ) {
              _id
            }
          }
        `,
      }),
    });

    for (const sub of root.subCategories) {
      const subCategory = await fetch(`${vendors.unchained.baseUrl}${vendors.unchained.adminApi}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            mutation {
              createCategory(
                name: "${sub.name}"
                slug: "${sub.name.toLowerCase().replace(/\s+/g, '-')}"
                parentId: "${rootCategory.data.createCategory._id}"
              ) {
                _id
              }
            }
          `,
        }),
      });

      for (const leaf of sub.subCategories) {
        await fetch(`${vendors.unchained.baseUrl}${vendors.unchained.adminApi}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: `
              mutation {
                createCategory(
                  name: "${leaf.name}"
                  slug: "${leaf.name.toLowerCase().replace(/\s+/g, '-')}"
                  parentId: "${subCategory.data.createCategory._id}"
                ) {
                  _id
                }
              }
            `,
          }),
        });
      }
    }
  }

  // Create products
  for (const product of products) {
    await fetch(`${vendors.unchained.baseUrl}${vendors.unchained.adminApi}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          mutation {
            createProduct(
              title: "${product.name}"
              description: "${product.description}"
              slug: "${product.name.toLowerCase().replace(/\s+/g, '-')}"
              price: ${product.price}
              currency: "${product.currency}"
              variants: [{
                title: "Default"
                options: [{
                  title: "Color"
                  value: "${product.color}"
                }, {
                  title: "Size"
                  value: "${product.size}"
                }]
              }]
              media: ${JSON.stringify(product.images.map(url => ({
                url,
              })))}
              meta: ${JSON.stringify(product.metadata)}
            ) {
              _id
            }
          }
        `,
      }),
    });
  }
}

// Helper function to authenticate with each platform
async function authenticatePlatforms() {
  for (const [name, vendor] of Object.entries(vendors)) {
    try {
      switch (name) {
        case 'vendure':
          const vendureLogin = await fetch(`${vendor.baseUrl}${vendor.adminApi}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'superadmin',
              password: 'superadmin123',
            }),
          });
          const vendureToken = await vendureLogin.json();
          vendor.auth.admin = vendureToken.token;
          break;

        case 'medusa':
          const medusaLogin = await fetch(`${vendor.baseUrl}${vendor.adminApi}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'admin@medusa-test.com',
              password: 'medusa',
            }),
          });
          const medusaToken = await medusaLogin.json();
          vendor.auth.admin = medusaToken.token;
          break;

        case 'unchained':
          const unchainedLogin = await fetch(`${vendor.baseUrl}${vendor.adminApi}`, {
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
          const unchainedToken = await unchainedLogin.json();
          vendor.auth.admin = unchainedToken.data.loginAsUser.token;
          break;
      }
    } catch (error) {
      console.error(`Error authenticating with ${name}:`, error);
    }
  }
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

// Main function to seed data
async function seedData() {
  console.log('Starting data seeding...');
  
  await verifyServers();
  await authenticatePlatforms();

  // Generate test data
  console.log('Generating test data...');
  const products = Array(NUM_PRODUCTS).fill(null).map(createRandomProduct);
  const categories = buildCategoryStructure();
  const distribution = distributeProducts(products, categories);

  // Save test data for reference
  writeFileSync('test-data.json', JSON.stringify({
    products,
    categories,
    distribution,
  }, null, 2));

  // Seed each platform
  console.log('\nSeeding Vendure...');
  await seedVendure(products, categories);

  console.log('\nSeeding Medusa...');
  await seedMedusa(products, categories);

  console.log('\nSeeding Unchained...');
  await seedUnchained(products, categories);

  console.log('\nData seeding completed!');
}

seedData().catch(console.error); 