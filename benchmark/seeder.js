#!/usr/bin/env node

// E-commerce Platform Seeder
// This script populates Medusa, Vendure, and Unchained with test data

import fetch from 'node-fetch';
import { faker } from '@faker-js/faker';
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
    adminEndpoint: '/admin-api',
  },
  MEDUSA: {
    name: 'Medusa',
    baseUrl: 'http://localhost:3002',
    adminEndpoint: '/admin',
  },
  UNCHAINED: {
    name: 'Unchained',
    baseUrl: 'http://localhost:3003',
    adminEndpoint: '/graphql',
  }
};

// Data setup constants
const NUM_PRODUCTS = 20000;
const CURRENCIES = ['USD', 'CHF'];
const COLORS = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'purple', 'orange', 'pink', 'brown'];
const ROOT_CATEGORIES = 5;
const SUB_CATEGORIES_PER_CATEGORY = 10;
const SUB_SUB_CATEGORIES_PER_SUB_CATEGORY = 10;
const PRODUCTS_PER_CATEGORY = 40;

// Helper function to create a random product
function createRandomProduct(categoryId, index) {
  const title = faker.commerce.productName();
  const subtitle = faker.commerce.productAdjective() + ' ' + faker.commerce.product();
  const brand = faker.company.name();
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = Math.floor(Math.random() * 10) + 1;
  const description = faker.lorem.paragraphs({ min: 1, max: 5 });
  const numImages = Math.floor(Math.random() * 3) + 1;
  const images = Array.from({ length: numImages }, () => 
    faker.image.urlPicsumPhotos({ width: 800, height: 600 })
  );
  const tags = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => 
    faker.word.adjective()
  );
  const labels = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
    faker.commerce.productMaterial()
  );
  
  // Create USD and CHF prices
  const basePrice = parseFloat(faker.commerce.price({ min: 10, max: 1000 }));
  const prices = {
    USD: basePrice,
    CHF: basePrice * 0.9 // Simple conversion
  };
  
  return {
    id: `product-${index}`,
    title,
    subtitle,
    brand,
    color,
    size,
    description,
    images,
    tags,
    labels,
    prices,
    categoryId
  };
}

// Helper function to create category structure
function createCategoryStructure() {
  let categoryId = 1;
  const categories = [];
  
  // Create root categories
  for (let i = 0; i < ROOT_CATEGORIES; i++) {
    const rootCategory = {
      id: `root-${i + 1}`,
      name: faker.commerce.department(),
      level: 1,
      children: []
    };
    
    // Create subcategories
    for (let j = 0; j < SUB_CATEGORIES_PER_CATEGORY; j++) {
      const subCategory = {
        id: `sub-${i + 1}-${j + 1}`,
        name: faker.commerce.product(),
        level: 2,
        parent: rootCategory.id,
        children: []
      };
      
      // Create sub-subcategories
      for (let k = 0; k < SUB_SUB_CATEGORIES_PER_SUB_CATEGORY; k++) {
        const subSubCategory = {
          id: `subsub-${i + 1}-${j + 1}-${k + 1}`,
          name: faker.commerce.productAdjective() + ' ' + faker.commerce.product(),
          level: 3,
          parent: subCategory.id,
          categoryId: categoryId++
        };
        
        subCategory.children.push(subSubCategory);
      }
      
      rootCategory.children.push(subCategory);
    }
    
    categories.push(rootCategory);
  }
  
  return categories;
}

// Helper function to distribute products across categories
function distributeProducts(categories) {
  const products = [];
  let productIndex = 1;
  
  // Flatten the category structure to get all leaf categories
  const leafCategories = [];
  
  categories.forEach(rootCategory => {
    rootCategory.children.forEach(subCategory => {
      subCategory.children.forEach(subSubCategory => {
        leafCategories.push(subSubCategory);
      });
    });
  });
  
  // Create products for each leaf category
  leafCategories.forEach(category => {
    for (let i = 0; i < PRODUCTS_PER_CATEGORY; i++) {
      products.push(createRandomProduct(category.categoryId, productIndex++));
    }
  });
  
  return products;
}

// Seed Vendure with data
async function seedVendure() {
  console.log(`Seeding ${VENDORS.VENDURE.name}...`);
  
  try {
    // In a real implementation, this would make API calls to create products and categories
    // For this example, we'll just simulate it
    console.log(`Would create ${NUM_PRODUCTS} products in Vendure`);
    
    // Example of how an API call might look
    /*
    const response = await fetch(`${VENDORS.VENDURE.baseUrl}${VENDORS.VENDURE.adminEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token'
      },
      body: JSON.stringify({
        query: `
          mutation CreateProduct($input: CreateProductInput!) {
            createProduct(input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          input: {
            name: "Product Name",
            // Other properties
          }
        }
      })
    });
    
    const result = await response.json();
    */
    
    return { success: true, message: 'Simulated Vendure seeding complete' };
  } catch (error) {
    console.error(`Error seeding ${VENDORS.VENDURE.name}:`, error);
    return { success: false, error: error.toString() };
  }
}

// Seed Medusa with data
async function seedMedusa() {
  console.log(`Seeding ${VENDORS.MEDUSA.name}...`);
  
  try {
    // In a real implementation, this would make API calls to create products and categories
    // For this example, we'll just simulate it
    console.log(`Would create ${NUM_PRODUCTS} products in Medusa`);
    
    return { success: true, message: 'Simulated Medusa seeding complete' };
  } catch (error) {
    console.error(`Error seeding ${VENDORS.MEDUSA.name}:`, error);
    return { success: false, error: error.toString() };
  }
}

// Seed Unchained with data
async function seedUnchained() {
  console.log(`Seeding ${VENDORS.UNCHAINED.name}...`);
  
  try {
    // In a real implementation, this would make API calls to create products and categories
    // For this example, we'll just simulate it
    console.log(`Would create ${NUM_PRODUCTS} products in Unchained`);
    
    return { success: true, message: 'Simulated Unchained seeding complete' };
  } catch (error) {
    console.error(`Error seeding ${VENDORS.UNCHAINED.name}:`, error);
    return { success: false, error: error.toString() };
  }
}

// Save product and category data to files
async function saveTestData(categories, products) {
  try {
    const categoriesPath = join(__dirname, 'test-categories.json');
    const productsPath = join(__dirname, 'test-products.json');
    
    await writeFile(categoriesPath, JSON.stringify(categories, null, 2));
    console.log(`Categories saved to ${categoriesPath}`);
    
    await writeFile(productsPath, JSON.stringify(products, null, 2));
    console.log(`Products saved to ${productsPath}`);
  } catch (error) {
    console.error('Error saving test data:', error);
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

// Main function to seed all platforms
async function seedAll() {
  console.log('Starting e-commerce platform seeding...');
  
  // First verify servers are running
  await verifyServers();
  
  // Generate category structure
  const categories = createCategoryStructure();
  console.log(`Created ${categories.length} root categories with ${categories.length * SUB_CATEGORIES_PER_CATEGORY} subcategories and ${categories.length * SUB_CATEGORIES_PER_CATEGORY * SUB_SUB_CATEGORIES_PER_SUB_CATEGORY} sub-subcategories`);
  
  // Generate products
  const products = distributeProducts(categories);
  console.log(`Created ${products.length} products distributed across categories`);
  
  // Save test data to files
  await saveTestData(categories, products);
  
  // Seed each platform
  const results = {
    vendure: await seedVendure(),
    medusa: await seedMedusa(),
    unchained: await seedUnchained()
  };
  
  // Print results
  console.log('\n--- Seeding Results ---\n');
  for (const [platform, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`${platform}: SUCCESS - ${result.message}`);
    } else {
      console.log(`${platform}: FAILED - ${result.error}`);
    }
  }
  
  console.log('\nSeeding completed!');
}

// Run the seeder
seedAll().catch(error => {
  console.error('Seeding error:', error);
  process.exit(1);
}); 