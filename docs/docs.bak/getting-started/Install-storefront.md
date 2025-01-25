---
sidebar_position: 2
title: Install and setup the storefront web-app
sidebar_label: Run Example Storefront
---

To test the Unchained Engine, set up the test frontend project **Storefront** created with [React.js](https://reactjs.org/) and [Next.js](https://nextjs.org/) locally.

## Prerequisites

The storefront installation requires Node.js version >= 20.

```bash
node --version
v22.12.0
```

## Step 1: Installation

The **Storefront** project is a [Next.js](https://nextjs.org/) based web app that connects to your Unchained Engine through [GraphQL](https://graphql.org/) queries.

1. Create a new folder for your project.

```bash
mkdir my-storefront-webapp
cd my-storefront-webapp
```

2. Use the Unchained initialization script to download the code.

```bash
npm init @unchainedshop
```

3. Select the installation template. Choose **storefront**.

```bash
? What type of template do you want ›
Full stack e-commerce
Storefront <--
Unchained engine
```

4. Select the directory (press `enter` to use the current directory) and whether to initialize git.

```bash
? Directory name relative to current directory
 (press Enter to use current directory) ›
? Do you want Initialize git? no / yes
```

5. Install the npm packages.

```bash
npm install
```

## Step 2: Start the app

Start the app and ensure the engine runs by setting the `UNCHAINED_ENDPOINT` environment variable.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) to check your storefront web app is running correctly.

## Connect to a remote test Unchained Engine

To see prefilled product data, update the `.env` settings to connect to Unchained's remote test engine.

- Stop the app: `ctrl+c`
- Update the endpoint in the `.env` file to: `UNCHAINED_ENDPOINT=https://my-unchained-instance/graphql`
- Restart the app:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) to see the products in your store.

![diagram](../assets/Storefront-Swag-Startscreen.png)