---
sidebar_position: 2
title: Development Environment Setup
sidebar_label: Setup Environment
---

# Development Environment Setup

This guide will help you prepare your development environment for working with Unchained Engine.

## System Requirements

### Required Software

#### Node.js (v22 or newer)
Unchained Engine requires Node.js 22+ for optimal performance and compatibility.

**Check your version:**
```bash
node --version
```

**Install or update Node.js:**
- Using [nvm](https://github.com/nvm-sh/nvm) (recommended):
  ```bash
  nvm install 22
  nvm use 22
  ```
- Direct download from [nodejs.org](https://nodejs.org/)

#### MongoDB (v6.0 or newer)
Unchained uses MongoDB as its primary database but you do **not** have to install MongoDB!

Unless you set an explicit connection string, Unchained will automatically download an appropriate version and run it locally for you, thanks to https://typegoose.github.io/mongodb-memory-server/

**Alternative: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string and set it via `MONGO_URL` environment variable

**Alternative: Postgres via FerretDB**
1. Setup Postgres
2. Start the FerretDB Docker container
3. Get your connection string and set it via `MONGO_URL` environment variable
4. Set the `UNCHAINED_DOCUMENTDB_COMPAT_MODE` environment variable to 1

## Next Steps

Your environment is now ready! Continue to [Initialize Your Project →](./run-local)