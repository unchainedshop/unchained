---
sidebar_position: 3
title: Start your first Unchained Project
description: Create a new Unchained Engine project from the template, configure it, and run it locally with hot-reload.
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
Basic Storefront
Kitchensink Backend

# 2. Enter project name (or press Enter for default)
? Name of project › my-shop

# 3. Enter directory name (press Enter to use current directory)
? Directory name relative to current directory › .

# 4. Initialize git repository (choose based on your preference)
? Do you want Initialize git? › no / yes
```

:::note Versioning
The template tracks the Unchained Engine v5 alpha releases, while `npm` `latest` of the engine packages is still 4.8.x.
:::

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

Your Unchained project is now initialized and running locally! Continue with the Quick Start guide:

- **[Create Your First Product](./first-product)** - Learn how to create and publish products in the Admin UI
- **[Create Your First Order](./first-order)** - Complete the checkout flow and see your first order

Once you've completed the Quick Start, explore [Platform Configuration](../platform-configuration/) to customize your shop.

## Development Workflow / Troubleshooting

Both sub-projects use the same scripts (`npm run dev`, `npm run build`, `npm run start`, `npm run lint`) and support hot reloading — the engine restarts on code changes, the storefront refreshes in the browser.

Unchained-specific things to check when something doesn't work:

- **Database**: Without a `MONGO_URL` set, the engine downloads and runs a local MongoDB via mongodb-memory-server (see engine logs). Set `MONGO_URL` to use your own instance.
- **Storefront can't reach the API**: Check `UNCHAINED_ENDPOINT` in the storefront's `.env.local` — it must point to the engine's GraphQL endpoint (default `http://localhost:4010/graphql`).