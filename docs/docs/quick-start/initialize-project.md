---
sidebar_position: 3
title: Initialize Your Project
sidebar_label: Initialize Project
---

# Initialize Your Project

This guide walks you through creating a new Unchained Engine project and storefront from scratch.

## Project Structure Overview

A typical Unchained project consists of two main services:

```
my-shop/
├── engine/          # Unchained Engine (Backend API)
│   ├── src/
│   ├── package.json
│   └── .env
└── storefront/      # Next.js Storefront (Frontend)
    ├── pages/
    ├── components/
    ├── package.json
    └── .env.local
```

## Step 1: Scaffold your project

### npm init

```bash
# Initialize Unchained Engine
npm init @unchainedshop
```

When prompted, select:
- Template: **Full Stack E-Commerce**

```bash
? What type of template do you want ›
Full Stack E-Commerce <--
Storefront
Unchained Engine 
```

### Configure the Engine

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment configuration:**
   ```bash
   cp .env.defaults .env
   ```

3. **Edit `.env` file with your settings:**
   ```env
   # MongoDB Connection
   MONGO_URL=mongodb://localhost:27017/my-shop
   
   # Server Configuration
   PORT=4010
   ROOT_URL=http://localhost:4010
   
   # Admin User (auto-created on first start)
   SEED_ADMIN_USERNAME=admin@myshop.com
   SEED_ADMIN_PASSWORD=mysecurepassword
   
   # File Upload Directory
   FILE_STORAGE_PATH=./uploads
   
   # Email Settings (optional for development)
   EMAIL_FROM=shop@myshop.com
   EMAIL_URL=smtp://localhost:1025
   ```

### Start the Engine

```bash
# Start in development mode
npm run dev
```

You should see:
```
🚀 Unchained Engine started
📍 GraphQL Playground: http://localhost:4010/graphql
🔑 Admin UI: http://localhost:4010/admin
```

### Verify Engine Installation

1. Open http://localhost:4010 in your browser
2. Click on "GraphQL Playground" to explore the API
3. Try a simple query:
   ```graphql
   query {
     shopInfo {
       _id
       version
     }
   }
   ```

## Step 2: Create the Storefront

### Initialize the Storefront

```bash
# From project root
cd .. # back to my-shop/
mkdir storefront && cd storefront

# Initialize Storefront
npm init @unchainedshop
```

When prompted, select:
- Template: **Storefront**
- Package manager: **npm** (or your preference)

### Configure the Storefront

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment configuration:**
   ```bash
   cp .env.defaults .env.local
   ```

3. **Edit `.env.local` file:**
   ```env
   # Unchained Engine URL
   UNCHAINED_ENDPOINT=http://localhost:4010/graphql
   
   # Storefront Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_TITLE=My Shop
   
   # Optional: Connect to demo engine for sample data
   # UNCHAINED_ENDPOINT=https://engine.unchained.shop/graphql
   ```

### Start the Storefront

```bash
# Start in development mode
npm run dev
```

The storefront will be available at http://localhost:3000

## Step 3: Connect and Verify

### Test the Connection

1. Open http://localhost:3000 in your browser
2. You should see the default storefront homepage
3. Check browser console for any connection errors

### Create Your First User

1. Click "Sign Up" in the storefront
2. Create a new account
3. Verify email (check console logs in development)

## Project Structure Details

### Engine Structure

```
engine/
├── src/
│   ├── index.js          # Main entry point
│   ├── plugins/          # Custom plugins
│   ├── modules/          # Custom modules
│   └── email-templates/  # Email templates
├── uploads/              # File storage
├── package.json
├── .env
└── .env.defaults
```

### Storefront Structure

```
storefront/
├── pages/                # Next.js pages
│   ├── index.js         # Homepage
│   ├── shop/            # Product pages
│   └── checkout/        # Checkout flow
├── components/          # React components
├── lib/                 # Utilities and hooks
├── public/              # Static assets
├── styles/              # CSS/styling
├── package.json
└── .env.local
```

## Development Workflow

### Hot Reloading

Both engine and storefront support hot reloading:
- Engine: Changes to code automatically restart the server
- Storefront: Changes immediately reflect in the browser

### Useful Commands

**Engine Commands:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test            # Run tests
npm run lint        # Run linter
```

**Storefront Commands:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint        # Run linter
```

## Common Configuration Options

### Enable Plugins

In `engine/src/index.js`:
```javascript
import { startPlatform } from '@unchainedshop/platform';
import { PaymentProviderType } from '@unchainedshop/core-payment';

startPlatform({
  plugins: [
    // Add custom plugins here
  ],
  modules: {
    // Configure core modules
    payment: {
      filterSupportedProviders: ({ providers }) => {
        return providers.filter(p => 
          p.type === PaymentProviderType.INVOICE
        );
      }
    }
  }
});
```

### Customize Storefront Theme

In `storefront/styles/globals.css`:
```css
:root {
  --primary-color: #0070f3;
  --secondary-color: #ff6b6b;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
}
```

## Troubleshooting

### Engine Issues

**Port Already in Use**
```bash
# Find process using port 4010
lsof -i :4010
# Kill the process or use different port in .env
```

**MongoDB Connection Failed**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database permissions

### Storefront Issues

**API Connection Failed**
- Verify engine is running
- Check `UNCHAINED_ENDPOINT` in `.env.local`
- Look for CORS errors in browser console

**Build Errors**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Next Steps

Your Unchained project is now initialized and running! Continue to [Configure Admin UI →](./admin-ui-setup)