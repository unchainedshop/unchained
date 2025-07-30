---
sidebar_position: 1
title: Quick Start
sidebar_label: Overview
---

# Quick Start Guide

This guide will help you set up a complete e-commerce solution in about 5 minutes.

## What You'll Build

By the end of this guide, you'll have a fully working web shop with your first product and first test-order.

## Guide Structure

This Quick Start guide is organized into the following sections:

1. **[Development Environment Setup](./setup-environment)** - Install required tools and prepare your system
2. **[Initialize Your Project](./initialize-project)** - Create and configure your Backend project and Storefront
3. **[Configure Admin UI](./admin-ui-setup)** - Set up the administration interface
4. **[Create Your First Product](./first-product)** - Add products and complete your first sale

## Architecture Overview

Unchained Engine follows a headless architecture with three main components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Storefront    │────▶│ Unchained Engine│◀────│    Admin UI     │
│   (Next.js)     │     │   (GraphQL API) │     │      (SPA)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │     MongoDB     │
                        └─────────────────┘
```

- **Unchained Engine**: The core API server providing GraphQL endpoints
- **Storefront**: Your customer-facing web application
- **Admin UI**: Management interface for products, orders, and settings

## Quick Commands Reference

```bash
# Create new Unchained Engine
npm init @unchainedshop

# Start development server
npm run dev
```

## Next Steps

Ready to get started? Continue to [Development Environment Setup →](./setup-environment)

## Getting Help

- 📚 [Full Documentation](/docs)
- 💬 [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)
- 🐛 [Report Issues](https://github.com/unchainedshop/unchained/issues)
- 📧 [Contact Support](mailto:support@unchained.shop)