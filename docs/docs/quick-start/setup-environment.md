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

#### Database (SQLite/Turso)
Unchained Engine v5+ uses SQLite locally or Turso for cloud deployments. **No database installation required!**

By default, Unchained creates a local SQLite file (`unchained.db`) in your project directory. For cloud deployments, you can use [Turso](https://turso.tech) - a SQLite-compatible edge database.

**Local Development (Default)**
- No configuration needed
- Data stored in `unchained.db` file
- Perfect for development and testing

**Cloud Deployment (Turso)**
1. Create a free account at [Turso](https://turso.tech)
2. Create a new database
3. Get your connection string and auth token
4. Set environment variables:
   ```bash
   DRIZZLE_DB_URL=libsql://your-db.turso.io
   DRIZZLE_DB_TOKEN=your-auth-token
   ```

## Next Steps

Your environment is now ready! Continue to [Initialize Your Project →](./run-local)