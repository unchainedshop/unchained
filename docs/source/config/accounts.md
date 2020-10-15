---
title: "Module: Accounts"
description: Configure the Accounts Module
---

The accounts management system in Unchained Engine is reliant on [accounts-js](https://github.com/accounts-js/accounts) which is employed in `unchained:core-users`.

`unchained:core-users` exports 4 values `randomValueHex`, `dbManager`, `accountsPassword` and `accountsServer`.

- `randomValueHex` generates random string which is used for in the login tokens generation process.

- `dbManager` an instance of [DatabaseManager](https://www.accountsjs.com/docs/api/database-manager/index) which is used for database related operations.

- `accountsPassword` an instance of [AccountsPassword](https://www.accountsjs.com/docs/api/password/classes/accountspassword) for passwords storage and regulation.

- `accountsServer` an instance of [AccountsServer](https://www.accountsjs.com/docs/api/server/classes/accountsserver/) for users administration. 


