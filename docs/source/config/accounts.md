---
title: 'Accounts'
description: Configure the Accounts Module
---

In this module the developer can manage the accounts with default settings or provide a custom settings.

Disable automatically sending verification e-mails after signup or enrollment:

The accounts management system in Unchained Engine is reliant on [accounts-js](https://github.com/accounts-js/accounts) which is employed in `@unchainedshop/core-users`.

`@unchainedshop/core-users` exports 4 values `randomValueHex`, `dbManager`, `accountsPassword` and `accountsServer`.

- `randomValueHex` generates random string which is used for in the login tokens generation process.

- `dbManager` an instance of [DatabaseManager](https://www.accountsjs.com/docs/api/database-manager/index) which is used for database related operations.

- `accountsPassword` an instance of [AccountsPassword](https://www.accountsjs.com/docs/api/password/classes/accountspassword) for passwords storage and regulation.

- `accountsServer` an instance of [AccountsServer](https://www.accountsjs.com/docs/api/server/classes/accountsserver/) for users administration.

You can customize options value defined in `accountServer` and `accountsPassword` default values in addition to Unchained defined configuration property values by passing `server` and/or `password` objects to `accounts` module configuration object.

`accountServer` accepts `loginExpirationInDays` in `server` object with default 30 days

In this example we are customizing session time and verification email sending after sign up defined by Unchained and accountsjs respectively

```
const options = {
  accounts: {
    mergeUserCartsOnLogin: false,
    server: {
      loginExpirationInDays: 1,
    },
    password: {
        sendVerificationEmailAfterSignup: true
    }
  },
};
```

For more on Order module read the **[API]**
