---
title: Building full e-commerce stack
sidebar_title: Quick Start
---

> In this section we will walk through on how to go about and create an e-commerce storefront
> that uses running Unchained instance and storefront deployed on Vercel

This tutorial will help you:

- Obtain a basic understanding of the architecture
- Bootstrap a basic Unchained-backed project
- Write a pricing plugin
- Deploy an Unchained Engine-backed project

This guide assumes that you are familiar with the command line and
JavaScript, and that you have a [nodejs >= v14](https://nodejs.org/en/) installed.

## Step 1: Obtaining Unchained instance

In order to get a free cloud-hosted Unchained instance, you need to [sign up here](https://unchained.shop/en/signup).
Once registered, fill out the forms with all the data required to create an Unchained instance to build your first organization.

After having created an organization, you are able to create an instance of Unchained under that organization. This step will require you to fill out a form with information needed to successfully set up a fresh Unchained instance and its size, domain, UI endpoint, other payment, and delivery-related information.

## Step 2: Obtaining Storefront

1. Initialize a new storefront template with npm (or another package manager you prefer, such as Yarn):

```bash
mkdir storefront && cd storefront
npm init @unchainedshop storefront
npm install
```

2. Add `.env` file in the root directory of your storefront with all the required values:

```
UNCHAINED_ENDPOINT=https://your-unchained-instance.rocks/graphql
```

Note there are other environment variables you can modify to suit your need while developing locally, below are all the environment variables you can customize with their default values.

```
FRONTEND_URL=http://localhost:3000
GRAPHQL_ENDPOINT=http://localhost:3000/api/graphql
NODE_ENV=development
SKIP_INVALID_REMOTES=false
UNCHAINED_CREATE_THEME=
UNCHAINED_CREATE_THEME_FILE=theme.json
DATATRANS_MERCHANT_ID=1100019919
```

3. Start up the storefront

Once you have set the correct environment variables and installed all the required dependencies run the following command to startup the storefront.

```
npm run dev
```

Now you have a fully functional storefront using unchained instance for API. Check it out by browsing to the following URLs:

- http://localhost:3000 to see the front-end (storefront)

See it in action by adding `Assortments` and `Products` etc... using the Unchained Admin UI .

## Step 3: Deploy your storefront with Vercel

Once you have set up the storefront template and run it locally successfully the last step we need to do is go live. while you can use any hosting provider for this demo we will be using Vercel to handle the deployment since the storefront is also written with next.js.

1. Upload your storefront to Github.

2. Go to the official [vercel](https://vercel.com/) website and sign up for a new account.

3. Connect the repository where the storefront code is stored with Vercel and give it access to all the necessary privileges.

4. Set the required `env` production environment

```
UNCHAINED_ENDPOINT=https://your-unchained-instance.rocks/graphql
FRONTEND_URL=https://domain-of-your-frontend
GRAPHQL_ENDPOINT=https://domain-of-your-frontend/api/graphql
```

5. Deploy the storefront

## Next steps

Get to know the concepts

- [Carts](architecture/overview)
