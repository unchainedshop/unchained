---
sidebar_position: 1
title: Core Values
sidebar_label: Core Values
---

:::info
System Design of Unchained Engine
:::

**Free and Open Source Software**

Using OSS prevents vendor lock-in and fosters a community that supports each other. It ensures resilience
against economic issues like the bankruptcy of the software owner.

**Hackable / Code-first**

Unlike SaaS, which relies on extensive control panels for customization, Unchained Engine allows
configuration through code. This means a developer is always required, enabling customization even beyond
what the core developers intended.

**Headless / API-first**

User interfaces evolve rapidly, while core systems remain stable. By decoupling the Unchained Engine from
any specific UI, it remains flexible and long-lasting. However, there are
[cons](https://www.semrush.com/blog/going-headless-ecommerce-store/) to this approach.

## Layered Approach

Unchained Engine is built in layers:

| Unchained Engine Layers |
| ----------------------- |
| App                     |
| Platform                |
| Service Gateway         |
| Core Modules            |

When setting up a new project, you typically boot the platform layer by running `startPlatform`.

**App**

The user-land app is where your project-specific code lives, with Unchained Engine loaded as a framework
into a Node.js project.

**Platform**

The platform layer loads all default core modules, defines the GraphQL schema and resolvers, starts the
API server, work queue, and orchestrates module configuration, email templates, and authentication. The
"platform" and "api" packages belong to this layer. In rare cases, you might skip it to directly access
core modules, such as for federated microservices or custom APIs.

For extending the GraphQL API, adding payment or delivery options, or configuring core modules, check the
basic [configuration options](../config/booting) and [existing plugins](../plugins/plugin-overview.md)
first, then consult [advanced options](../advanced/overview).

**Service Gateway**

The service gateway composes functions from multiple modules to enable complex workflows, like checkout.
You can modify services by using or writing custom plugins and extend services by adding functions to
`startPlatform`
[options](https://docs.unchained.shop/types/interfaces/_unchainedshop_core.UnchainedCoreOptions.html).

**Core Modules**

Core modules contain business logic and database abstractions. You can modify modules through
configuration and plugins. To add or overwrite modules, check
[write custom modules](../advanced/custom-modules).

## API Design Principles

1. Unchained is stateless, with all data stored in MongoDB.
2. Non-logged-in users can only read certain data. For anonymous user actions like adding to cart and
   checkout, use the loginAsGuest mutation.
3. All business logic remains server-side, ensuring omni-channel support and minimal client-side domain
   logic.

Consequences of these principles:

1. Carts are defined as "open orders" and stored server-side, allowing users to add items on one device
   and checkout on another. After checkout, the cart becomes an immutable order.
2. Anonymous users can become registered users without losing order history or bookmarks. Carts merge if
   a user logs in during the buying process.
