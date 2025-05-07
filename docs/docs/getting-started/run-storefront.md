---
sidebar_position: 3
title: Run a basic Storefront App
sidebar_label: Run Storefront App
---

In this chapter, ou'll set up a basic storefront web app created with [React.js](https://reactjs.org/) and [Next.js](https://nextjs.org/) locally.

## Prerequisites

The storefront installation requires Node.js version >= 22.

```bash
node --version
v22.12.0
```

## Install the App

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

## Start it in dev mode

Start the app and ensure the engine runs by setting the `UNCHAINED_ENDPOINT` environment variable. To connect it to the API you've prepared in [Install Engine](./Install-engine.md), you don't have to do anything as http://localhost:4010/graphql is the default for `UNCHAINED_ENDPOINT`

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) to check your storefront web app is running correctly.

## Admire the Products

Assuming you followed the instructions in [Feed the DB](./feed-the-db.md) correctly, you can verify that the categories appear on the entry page now.

Choose a category to see the underlying products and start shopping! 😎

![diagram](../assets/Storefront_Startscreen.png)

## Place an Order
Now, you are able to go through a complete check-out and buy a product with the pay-per-invoice payment method.

On successful completion of an order you will find a new entry in the **Orders** list and a detailed order view including the the **Invoice Paid** option.

If something along the way didn't work, check [Feed the DB](./feed-the-db.md) again.


## Connect to a remote Unchained Engine

To connect your Storefront to any Unchained Endpoint, try this:

- Stop the app: `ctrl+c`
- Update the endpoint in the `.env` file to: `UNCHAINED_ENDPOINT=https://my-unchained-instance/graphql`
- Restart the app:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) to see the products in your store.

![diagram](../assets/Storefront-Swag-Startscreen.png)