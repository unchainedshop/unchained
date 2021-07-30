---
title: Install and setup the storefront web-app
sidebar_title: Install store
---

> To test the Unchained Engine we setup the test frontend project **Storefront** created with [React.js](https://reactjs.org/) and [Next.js](https://nextjs.org/) locally.

![diagram](../images/getting-started/Storefront_Setup.png)

This tutorial helps you:

- Install the storefront web app locally
- Conntect to the local Unchained Engine via [graphQL](https://graphql.org/)

## Prerequisites

The storefront installation requires a Node version > 14.
```bash
node --version
v14.17.1
```

## Step 1: Installation

The **Storefront** project is a [Next.js](https://nextjs.org/) based web app and connects to your Unchained Engine through [graphQL](https://graphql.org/) queries.

1. First create a new folder for your project to be installed.
```bash
mkdir my-storefront-webapp
cd my-storefront-webapp
```
2. Use the Unchained initialisation script to download the code.
```bash
npm init @unchainedshop
```
3. A message prompts you to select the installation template. Choose **storefront** by using the `down key` and press `enter` 
```bash
? What type of template do you want › 
Full stack e-commerce
Storefront <--
Unchained engine
```
4. Next two steps are to select the directory, as we already created a new empty directory you can simply press `enter`, and whether you want to initialise git which is up to you.
```bash
? Directory name relative to current directory 
 (press Enter to use current directory) › 
? Do you want Initialize git? no / yes
```
5. Install the npm packages
```bash
npm install
```

The installation script downloads, installs and initialises all files and packages required to build and run the storefront web app.

## Step 2: Setup connection

Before running the web app, you need to create an `.env` file in the root directory of _my-storefront-webapp_ and add the graphql API endpoint of your local Unchained Engine to the settings.

```
UNCHAINED_ENDPOINT=http://localhost:4010/graphql
```

## Step 3: Start the app

Now, start the app by using the following command.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) to check your storefront webapp is running correctly.

And that's it!

Your Unchained E-Commerce environment is fully setup and running locally.

## (Connect to a remote test Unchained Engine)

If you skipped the step of adding new products and categories as described in the [Getting Started - Add Product](/getting-started/engine-controlpanel) guide, your store is empty.<br />
With a little update of our `.env` settings we can change that by connecting to Unchained's remote test engine which contains some prefilled product data.

- Stop the app: `ctrl+c`
- Open the file in the _my-storefront-webapp_
- Update the endpoint in the `.env` file to: `UNCHAINED_ENDPOINT=https://engine.swag.unchained.shop/graphql`
- Restart the app:
```bash
npm run dev
```
- Open `localhost:3000` again to see some swaggy products popping up in your store. 😎

![diagram](../images/getting-started/Storefront-Swag-Startscreen.png)
