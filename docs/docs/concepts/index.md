---
sidebar_position: 1
title: Core Concepts
sidebar_label: Core Concepts
description: Foundational concepts for understanding Unchained Engine
---

# Core Concepts

Before diving into implementation, understanding the foundational concepts behind Unchained Engine will help you make better architectural decisions and extend the platform effectively.

## Key Concepts

### [Architecture](./architecture.md)
Learn about Unchained Engine's layered architecture and how the different layers interact.

### [Director/Adapter Pattern](./director-adapter-pattern.md)
The plugin system that powers Unchained Engine's extensibility. Understanding this pattern is essential for customizing payment, delivery, pricing, and other behaviors.

### [Order Lifecycle](./order-lifecycle.md)
How orders transition from cart to fulfillment, including the checkout process, payment handling, and delivery.

### [Pricing System](./pricing-system.md)
How prices are calculated using a chain of pricing adapters, including product pricing, delivery fees, payment fees, taxes, and discounts.

### [Authentication](./authentication.md)
Authentication patterns including guest users, registered users, and external identity providers (OIDC).

Unchained Engine is free and open source, code-first (configuration through code, not control panels), and headless (a storefront-agnostic GraphQL API).
