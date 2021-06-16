---
title: Building full e-commerce stack
sidebar_title: Quick Start
---

> In this section we will walk through on how to go about and create and e-commerce store front
> that uses runing unchained instance and store front deplyed on Vercel

This tutorial helps you:

- Obtain a basic understanding of the architecture
- Bootstrap a basic unchained backed project
- Write a pricing plugin
- Deploy an unchained engine backed project

This Guied assumes that you are familiar with the command line and
JavaScript, and that you have a [nodejs >= v14](https://nodejs.org/en/)  installed.

## Step 1: Obtaining uncahined instance

Inorder to get cloud hosted unchained instance you need to [sign up](https://unchained.shop/en/signup) and request 14 day trial.
once registered fill out the forms with all the data required to create an unchained instance is to create your first organization.
After creating and organization you are able to create an instance of unchained under that organization. this step will require you to fill out a form with information need to successfuly setup a fresh unchained instance and inclued, size, domain, UI enpoint and other payment and main related information.


## Step 2: Obtaining Store front

1. Initialize a new storefront template with npm (or another package manager you prefer, such as Yarn):

```bash
mkdir storefront && cd storefront

npm init @unchainedshop

npm install

```

2. Add `.env` file in the root directory of you storefront with all the required values:

```
UNCHAINED_ENDPOINT=https://your-unchained-instance.rocks/graphql
```

3. Start up the storefront 

```
npm run dev
```

Now you have a fully functional storefront using unchained instance for API. Check it out by browsing to the following URLs:

- http://localhost:3000 to see the front-end (storefront)

## Step 3: Deploy storefront with Vercel

Once you have setup the storefront template and run it locally successfuly the last step we need to do is go live. while you can use any hosting provider for this demo we will be using vercel to handle the deployment since the storefront is also writen with next.js.

1. upload storefront to github.

2. Go to the official [vercel](https://vercel.com/) website and sign up for a new account.

3. Connect the reposotory where storefront code is stored with vercel and give it access to all the necessary privilages.

4. set the required `env` production enviroments

```
UNCHAINED_ENDPOINT=https://your-unchained-instance.rocks/graphql
FRONTEND_URL=https://domain-of-your-frontend
GRAPHQL_ENDPOINT=https://domain-of-your-frontend/api/graphql
```
5. deploy the store front



## Next steps

Get to know the concepts

- [Carts](concepts/carts)
