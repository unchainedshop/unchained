---
title: Setup the Unchained Engine
sidebar_title: Install engine
---

> This tutorial walks you through installing and configuring a new [Meteor](https://www.meteor.com/) app with the server-side only Unchained Engine included.
> An advanced understanding of [Node.js](https://nodejs.org) and [graphQL](https://graphql.org/) is required to follow this tutorial

This tutorial helps you:

- Install and run the Unchained Engine locally
- Log into your admin control panel and add a product.

# Create a new Unchained Engine

In this section, we will walk you through the steps required to start up an Unchained Engine api server locally. To perform your first shopping task, we setup the test webapp _Storefront_ and connect it to our Unchained Engine.

## Step 1: Installation

Initialize a new Unchained Engine with `npm` (or another package manager such as Yarn):

```bash
mkdir my-unchained-engine-meteor-app
cd my-unchained-engine-meteor-app

npm init @unchainedshop engine

npm run install
```

Your project directory now contains a Meteor project with Unchained as a dependency

## Step 2: Start the Unchained Engine

```bash
meteor npm run dev
```

Open [localhost:4010](http://localhost:4010) to check if your meteor app is running correctly. You should see an **Login Screen**. Well, log-in! 

Username:   admin@unchained.local<br />
Password:   unchained#rocks


You should see the following admin console in your browser (Yes, the UI can be improved. However, it's an admin console not visible to any customer).

![diagram](./images/AdminConsole.png)

[localhost:4010/graphql](http://localhost:4010/graphql) opens the graphQL playground for you to easily execute queries and mutations. 

## (Step 3: Add a new product)



> To test the Unchained Engine the next step will be to setup the test frontend project _Storefront_ created with [React.js](https://reactjs.org/) and [Next.js](https://nextjs.org/) locally.

