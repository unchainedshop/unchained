---
sidebar_position: 1
title: Introduction
description: Overview
slug: /
---

**Unchained Engine is a high-performant, open-source, e-commerce framework for Node.js/Bun**

![diagram](./assets/System-Architecture.png)

#### Core Design Principes of Unchained Engine:

- **Codeability**, so you can extend the system with endless possibilities not restricted by "customization" or a settings-approach
- **GraphQL API**, allowing you to build modern and fully omni-channel storefronts
- **Stateless architecture**, allowing you to scale horizontally and vertically
- **Low Overhead** because we value simplicity and speed! Unchained runs on Node.js 22/23 and Bun 1.1, is pure ESM and directly uses the native Mongo-DB driver instead of a clunky DB abstraction
- **Production readiness**, because it's been used for years by companies running big B2C and B2B portals with 20'000+ articles and 100 concurrent users

### Solution Overview

The following diagram shows all applications and services provided by Unchained as open-source software for you to easily setup your first eCommerce store in a few minutes.

![diagram](./assets/Unchained_Ecosystem.png)

As you can see the Unchained Engine ecosystem consists of

- the **Engine** itself as server-side only GraphQL API included app to serve all functionality to manage the store \*
- the **Storefront** boilerplate web app which provides a customizable UI for the public store itself as [Next.js](https://nextjs.org/) project

The next chapter helps you setup an E-Commerce solution self-hosted.
