---
sidebar_position: 1
title: Overview
sidebar_label:  Overview
---

:::
System Design of Unchained Engine
:::
## Core Values

**Free and Open Source Software**

Usage of OSS prevents vendor lock-in. Using software that is open to the public leads to communities that help each other, the software is resilient to economic issues like bankruptcy of the software owner.

**Hackable / Code-first**

Non-hackable software (like SaaS) use the technique of "customizing", meaning it provides a massive control panel where every aspect of the software can be configured, themed or disabled. Sadly, there is always something that needs some extra development work and companies need to hire somebody to create a plugin. In Unchained Engine, the software flow is changed through the code and not through the UI. This means a software developer is always required to configure the platform. It's called "hackable" software and allows to configure even parts of the software that were not intended to get configured by the core developers.

**Headless / API-first**

User interfaces (like Web Shop Storefronts) rot at a much higher speed as the underlying processes and core systems. User interfaces change at a rapid speed: Technologies are born and die only a few years later, devices like smartwatches pop up, screen sizes vary. We think it's extremely important to have an e-commerce system that is going to stay for the long run like an ERP does, only then it's investable. By completely decoupling the Unchained Engine from any web shop user interface, it's usable in very flexible ways. But of course there are also [cons](https://www.semrush.com/blog/going-headless-ecommerce-store/) to that approach.

## Layered Approach

Unchained Engine is built in layers:

| Unchained Engine Layers       |
| ----------------------------- |
| App                           |
| Platform                      |
| Service Gateway (Coming soon) |
| Core Modules                  |

When you set up a new Unchained Engine project, you usually just boot the platform layer by running `startPlatform`.

**App**
Unchained Engine is loaded as a framework into a common Node.js project. The user-land app is where your project and your custom project-specific code live.

**Platform** loads all the default core modules into a unified object, defines the GraphQL schema and resolvers, starts the API server, the work queue and orchestrates configuration of modules, e-mail templates and authentication. The packages "platform" and "api" both belong to the Platform Layer. In some very rare cases you might want to skip the it and directly access the core modules:

- You want to use a very custom version of an existing core module
- You want to decompose the backend into federated microservices (run orders core-module on another instance for example)
- You want to have a custom made REST API instead of the GraphQL API

You don't need to implement your own platform layer if you just want to extend the GraphQL Schema, add new job types or configure core-modules. For these cases, [configuration options](../config/booting) exist.

**Service Gateway** composes functions of multiple modules together to enable sophisticated workflows like a checkout where many different modules have to play together. This layer does not exist yet as the modules currently just interdependent with each other.

**Core Modules** are thematically split up packages that contain business logic and database abstraction to allow a developer to influence the way the modules behave. You as a developer can change the way a module behaves by configuration and writing plugins.

## API Design Principles:

1. Unchained is stateless and doesn‘t know browser sessions. All data is being held in MongoDB (persistent data, transactional data) or Redis (caching, Pub/Sub).
2. Non-logged in users can only read certain data, but not mutate anything. For cases where you need an anonymous user (like letting a client add stuff to cart and checkout without registration) you can use the loginAsGuest mutation that creates a temporary user.
3. All business logic should stay on the server-side, that way your E-Commerce project stays truly omni-channel and domain logic in the client is reduced to an absolute minimum.

Some consequence of these design decisions:

1. In Unchained, carts are defined as „open orders“ and are stored server side. A user can add something to a cart on one device and then checkout on another. After checkout, the cart becomes an immutable order.
2. Anonymous users can become real users without loosing order history or bookmarks done as anonymous user. Carts even get merged together if somebody starts anonymously and decides to login during the process of buying a good.