---
sidebar_position: 2
title: Advanced deployment settings for storefront web-app to Vercel
sidebar_label: Vercel deployment of storefront
---


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

See it in action by adding `Assortments` and `Products` etc... using the Unchained Admin UI.

## Step 3: Deploy storefront with Vercel

Once you have set up the storefront template and run it locally successfully the last step we need to do is go live. while you can use any hosting provider for this demo we will be using vercel to handle the deployment since the storefront is also written with next.js.

1. upload storefront to Github.

2. Go to the official [vercel](https://vercel.com/) website and sign up for a new account.

3. Connect the repository where the storefront code is stored with vercel and give it access to all the necessary privileges.

4. set the required `env` production environment

```
UNCHAINED_ENDPOINT=https://your-unchained-instance.rocks/graphql
FRONTEND_URL=https://domain-of-your-frontend
GRAPHQL_ENDPOINT=https://domain-of-your-frontend/api/graphql
```

5. deploy the storefront

## Next steps

Get to know the concepts

- [Architecture](/concepts/architecture-overview)

4. set the required `env` production environment

```
UNCHAINED_ENDPOINT=https://your-unchained-instance.rocks/graphql
FRONTEND_URL=https://domain-of-your-frontend
GRAPHQL_ENDPOINT=https://domain-of-your-frontend/api/graphql
```

5. deploy the storefront