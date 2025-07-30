---
sidebar_position: 3
title: Initialize and run your first Unchained Project
sidebar_label: Initialize and Run
---

# Initialize and run your first Unchained Project

This guide walks you through creating and runnging a new project on localhost.

## Project Structure Overview

A typical Unchained project consists of two main sub-projects:

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

To start, you can use our npm init helper:
```bash
mkdir my-shop && cd my-shop
npm init @unchainedshop
```

When prompted for the template, select:
- **Full Stack E-Commerce**

```bash
? What type of template do you want ›
Full Stack E-Commerce <--
Storefront
Unchained Engine
```

When prompted for the Directory name, just press enter.

### Start the Engine

1. **Install dependencies:**
```bash
npm install
```

The install script will install the dependencies in both engine and storefront sub-directories.

2. **Start in development mode:**
```bash
npm run dev
```

Both services will be started in parallel, the backend and the storefront.

You should see:
```
🚀 Unchained Engine started
🍎 Storefront: http://localhost:3000
🔑 Admin UI: http://localhost:4010
📍 GraphQL Playground: http://localhost:4010/graphql
```

### Verify Engine Installation

1. **Configure your Backend**

- Open http://localhost:4010 in your browser
- Setup your administrator user, the built-in E-Mail preview will popup with a verification link, it's not needed to click it.
- Go the dashboard and complete the onboarding (essentials)

To have a working checkout, you need:
- 1 currency
- 1 country with the default currency set
- 1 language
- 1 payment provider (use Invoice -> Invoice)
- 1 delivery provider (use Shipping -> Manual)
- 1 simple product in status published with at least one price setup in commerce.

2. **Verify Checkout on Storefront**

- Open http://localhost:3000 in your browser
- Scroll down, you should see your product
- Add it to the cart and complete the payment process
- At the end of the process, the built-in E-Mail preview should show the E-Mail Confirmation


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
- Ensure MongoDB is running by checking engine logs
- Check connection string in dotenv files
- Verify database permissions if custom connection string is used

### Storefront Issues

**API Connection Failed**
- Verify engine is running
- Check `UNCHAINED_ENDPOINT` in `.env.local`
- Look for CORS errors in browser console

**Build Errors**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Next Steps

Your Unchained project is now initialized and running and you should see your first confirmed order in the backend.