# Software Architecture

The unchained.shop Platform (technical)

## Platform State of the Union

**Unchained Engine**
Backend Engine, OSS.
- Current version: 0.51.6
- [Github Repository][2]
- DB: MongoDB
- Programming language: Javascript ES6
- Platform: Meteor.js 1.10 (Node.js 12)
- Core Libraries: Apollo Server, Meteor Accounts system, Meteor DBMS

**Unchained.shop Storefront**
Storefront UI used for unchained.shop, OSS.
- Current version: 0.51.6
- [Github Repository][3]
- Programming language: Javascript ES6
- Platform: Vercel Next.js 9
- Core Libraries: React.js, Apollo Client

**Unchained Admin UI**
Unchained on demand Admin UI, Closed Source. A very basic initial version will get released and handed over to the community.
- Current version: 0.51.6
- [Github Repository][2]
- Programming language: Javascript ES6 (Node.js carbon LTS)
- Platform: Vercel Next.js 9
- Core Libraries: Facebook React.js, MDG Apollo Client

** Unchained Control Panel**
Fork of Unchained Admin UI. Will become our Control Panel solution and exclusively available for all engines hosted and maintained by us (SaaS).
- Current version: planned

** Unchained Plugin Marketplace**
Custom Unchained instance that allows plugin developers sell their custom made extensions (SaaS).
- Current version: planned

## Programming languages

The only programming language used in our products currently is Javascript ES6. We plan to diversify more in the future by building new server-side microservices with modern programming languages like Rust, Swift or Go.

[1]:	https://github.com/unchainedshop/unchained-evolution
[2]:	https://github.com/unchainedshop/unchained
[3]:	https://github.com/unchainedshop/unchained-website
