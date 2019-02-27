# Unchained Engine

Licensed under the EUPL 1.2

[![CLA assistant](https://cla-assistant.io/readme/badge/unchainedshop/unchained)](https://cla-assistant.io/unchainedshop/unchained)


### Settings API
E.g. given these settings:

```
// meteor-settings.json
{
  "unchained": {
    "files": {
      "media": {
         "maxSize": 10485760
      }
    }
  }
}
```
you can now access `maxSize` with this:

```
import { getSetting } from 'meteor/unchained:core-settings';

const maxSize = getSetting('files.media.maxSize')

// it uses lodash.get, so you can pass a path as an array
const maxSize = getSetting(["files", "media", "maxSize"])

// and you can specify a default value

const maxSize = getSetting("files.avatars.maxSize", 10485760);
```
### configure FileCollections
to set gridfs for all collections, use this:

```
{
  "unchained": {
    "files": {
      "default": {
        "storage": {
          "type": "gridfs"
        }
      }
    }
  }
}
```
all collections will use `default`, unless specified directly:

```
{
  "unchained": {
    "files": {
      "media": {
        "maxSize": 10485760
      }
    }
  }
}
```
