---
sidebar_position: 3
title: Start your first Unchained Project
sidebar_label: Initialize and Run (Local)
pagination_next: quick-start/first-product
---

# Start your first Unchained Project

This guide walks you through creating and running a new project on localhost. [Alternatively, you can scaffold your first Unchained project with Railway and continue from there.](./run-railway.md)

Using Railway has the benefit that you start with a deployed project including CI pipelines. From there, you can walk your way back by "ejecting" to your own GitHub repository.


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

## Scaffold your project

### npm init

To start, you can use our npm init helper:
```bash
mkdir my-shop && cd my-shop
npm init @unchainedshop
```

When running the init command, you'll be prompted with several questions:

```bash
# 1. Select template type
? What type of template do you want ›
Full Stack E-Commerce <-- Select this
Storefront
Unchained Engine

# 2. Enter project name (or press Enter for default)
? Name of project › my-shop

# 3. Enter directory name (press Enter to use current directory)
? Directory name relative to current directory › .

# 4. Initialize git repository (choose based on your preference)
? Do you want Initialize git? › no / yes
```

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

You should see output similar to:
```
[dev:engine] Server listening at http://[::]:4010
[dev:storefront] - Local: http://localhost:3000
```

:::note
- The exact output format may vary depending on your terminal
- If port 3000 is already in use, the storefront will automatically use the next available port
- You may see `.env not found` warnings - this is normal, as defaults are loaded from `.env.defaults`
:::

**Access Points:**
- **Admin UI**: http://localhost:4010
- **Storefront**: http://localhost:3000
- **GraphQL Playground**: http://localhost:4010/graphql

### Verify Engine Installation

1. **Configure your Backend**

- Open http://localhost:4010 in your browser
- Set up your administrator user. The built-in email preview will pop up with a verification link—it's not necessary to click it.
- Go to the dashboard and complete the onboarding (essentials)

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
- At the end of the process, the built-in email preview should show the email confirmation

## Next Steps

Your Unchained project is now initialized and running locally, and you should see your first confirmed order in the Admin UI. You can now turn to our next section, "Platform Configuration," to find out how to configure and/or extend your project to your needs.

## Development Workflow / Troubleshooting

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