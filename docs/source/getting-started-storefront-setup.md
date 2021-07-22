---
title: Install and setup the shop
sidebar_title: Install shop
---

> To test the Unchained Engine we setup the test frontend project **Storefront** created with [React.js](https://reactjs.org/) and [Next.js](https://nextjs.org/) locally.

This tutorial helps you:

- Install the shop Storefront locally
- Conntect to the Unchained Engine via graphQL

## Step 1: Installation

The **Storefront** project is a Next.js based web app using the React library and connects to your Unchained Engine through graphQL queries.

Initialize a new Unchained Engine with `npm` (or another package manager such as Yarn):

```bash
mkdir my-storefront-webapp
cd my-storefront-webapp

npm init @unchainedshop storefront

npm run install
```

Your project directory now contains a Next.js project that connects per default to the local Unchained Engine.

## Step 2: Start the app

Before running the web app, you need to create an empty `.env` file in the root directory of _my-storefront-webapp_ (we will use that later in the tutorial).

Now, start the app by using the following command.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000) to check your storefront webapp is running correctly.

And that's it!

Your Unchained E-Commerce environment is fully setup and running locally.

## (Step 3: Connect to a remote test Unchained Engine)

If you skipped the step of adding a product in the [Setup the Unchained Engine](/getting-started-engine) guide, your store is empty. With a little update of our enviroment we can connect to Unchained's remote test engine which contains some prefilled product data.

- Stop the app: `ctrl+c`
- Open the `.env` file in the _my-storefront-webapp_
- Add this line and save: `UNCHAINED_ENDPOINT=https://engine.swag.unchained.shop/graphql`
- Restart the app: `npm run dev`
- Check `localhost:3000` to contain some products.

![diagram](./images/StorefrontSwagShop.png)

