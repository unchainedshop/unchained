---
sidebar_position: 1
title: Project Setup
sidebar_label: Install the Engine
---

This section walks you through the steps to create a basic Node.js project and boot the Unchained Engine API server locally.

## Setup the Backend API

1. Create a new folder for your project.

```bash
mkdir my-unchained-engine
```

1. Use the Unchained initialization script to download the code.

```bash
npm init @unchainedshop
```

3. Select the installation template. Choose **Unchained engine**.

```bash
? What type of template do you want ›
Full Stack E-Commerce
Storefront
Unchained Engine <--
```

4. Select the directory (press `enter` to use the current directory) and whether to initialize git.

```bash
? Directory name relative to current directory
 (press Enter to use current directory) ›
? Do you want Initialize git? no / yes
```

5. Ensure your Node version is 22+ and install the npm packages.

```bash
cd my-unchained-engine
npm install
```

## Start the Engine

```bash
npm run dev
```

Open [localhost:4010](http://localhost:4010) to check if your Unchained Engine is running correctly. You should see the following **Landing page** in your browser:

![diagram](../assets/engin_intro.png)


## Add Products

To set up the store and add products and categories using the Unchained Admin UI, follow the instructions in the next chapter [Add Products](/getting-started/feed-the-db) using your local instance at [localhost:4010](http://localhost:4010).