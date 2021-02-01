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
