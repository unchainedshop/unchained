---
sidebar_position: 10
title: Admin UI Extension
sidebar_label: Admin UI Extension
---
:::info
 Extending Admin UI 
:::

Admin UI out of the box supports most of the administration tasks a user wants to perform. 
However, unchained is flexible and can be extended to support any data or data structure by [Extending the schema](../advanced/extending-schema). While this is great, but it means the data will not be accessible through admin UI.

In order to view the additional information in your unchained engine you need to provide admin UI a configuration object
that contains fragments of the additional types and inject to the unchained platform on start up.

the configuration object `AdminUiConfig` has a field called `customProperties` that is an array of `AdminUiConfigCustomEntityInterface` objects where `AdminUiConfigCustomEntityInterface` type has two fields: `entityName`, which is a non-nullable string, and `inlineFragment`, which is also a non-nullable string that holds the fragment definition.


```graphql

const config = {
  customProperties: [
    {
      entityName: 'User',
      inlineFragment: `...on User {
        _id
        avatar {
          _id
          name
          size
          type
          url
        }
      }`
    }
  ]
}
```


After we defined all the additional fragments along with their type, we simply pass them to unchained platform 
like shown below.

```
await startPlatform({
    ...,
    adminUiConfig: config,
    ...
    })
```

Note that `entityName` should be an Entity supported by Unchained.


That's it, now the new custom entity data will be visible (Read-only) in Admin UI.