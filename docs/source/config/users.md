---
title: "Module: Users"
description: Configure the Users Module
---

Disable automatically sending verification e-mails after signup or enrollment:

```
const options = {
  modules: {
    users: {
      autoMessagingAfterUserCreation: false
    }
  }
};
```
### Storing additional values

The standard user data type stores most of the information a user could have. But if you want to store additional information in user, you can do so by extending `UserProfileInput` that is passed to the `Mutation.updateUserProfile` to store the additional fields you want :

```
extend input UserProfileInput {
  phoneNumbers: [CustomPhoneNumberInput!]
}

```
The data is stored in `User` object under  `meta` and  You can access the stored values by extending the user schema and adding a custom resolvers to map the stored data to the schema field. 

for detailed information about extending the schema refer to [Extending schema section](./extending-schema)


