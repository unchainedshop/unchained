---
title: 'Module: Users'
description: Configure the Users Module
---

### Storing additional values

The standard user data type stores most of the information a user could have. But if you want to store additional information in user, you can do so by using the `meta` field on in `Mutation.updateUserProfile`:

The data is stored in `User` object under `meta` and You can access the stored values by extending the user schema and adding a custom resolvers to map the stored data to the schema field.

for detailed information about extending the schema refer to [Extending schema section](./extending-schema)
