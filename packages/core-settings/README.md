# Settings (Unchained Engine)

This package contains api to define settings for the unchained engine.

## Usage

In this initial version core-setting support Meteor settings.

### defining settings in local development

start the app with `meteor --settings your-settings.json` with this content:

```
// this example would make unchained use gridfs instead of local file system to store files
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

### defining settings in production environments

in production you can save the json as a string and pass it as an environment variable `METEOR_SETTINGS`

### get settings

to get settings from the file you can use this api:

````
import { getSetting } from 'meteor/unchained:core-settings';

const value = getSetting("files.default"); // e.g. picks the object from the setting file above

// you can also use arrays to define the path to the property as an array

const someVariable = "default";
const value = getSetting(["files", somevariable]);

// you can specify a default value, that gets used if the path does not exist:

const value = getSetting("files.something", false);
// would return false unless files.somethign is defined with some other value


```
````
