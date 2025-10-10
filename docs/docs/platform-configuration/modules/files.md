---
sidebar_position: 9
sidebar_label: Files
title: Files Settings
---

```typescript
export interface FilesSettingsOptions {
  transformUrl?: (url: string, params: Record<string, any>) => string;
  privateFileSharingMaxAge?: number; // milliseconds
}
```

### URL Transformation

By transforming URL's for media, you can enable direct delivery from CDN systems or add thumbnailing system support.

Here is an example for a custom `transformUrl` implementation adding ad-hoc thumbnailing through Tumbor:

```typescript
import os from "os";
import crypto from "crypto";

const getNormalizedUrl = (url, myHostname = os.hostname()) => {
  try {
    // If the url is absolute, return
    const finalURL = new URL(url);
    return finalURL.href;
  } catch {
    try {
      // else try to fix by using hostname (for GridFS)
      const tempURL = new URL(url, `http://0.0.0.0`);
      return `${myHostname}:${process.env.PORT}${tempURL.pathname}`;
    } catch {
      // else return the transformed string because it's not an URL
      return url;
    }
  }
};

const { THUMBOR_SECRET, THUMBOR_ENDPOINT } = process.env;

const ThumbnailSizes = {
  small: ["150x"],
  medium: ["600x"],
  large: ["2048x"],
};

export const transformUrlWithThumbor = (url, params) => {
  if (THUMBOR_ENDPOINT && THUMBOR_SECRET) {
    const normalizedUrl = getNormalizedUrl(url);
    const parameters = ThumbnailSizes[params?.version?.toLowerCase()];
    if (parameters) {
      const unsafePath = `${parameters.join("/")}/${encodeURIComponent(normalizedUrl)}`;
      const hash = crypto
        .createHmac("sha1", THUMBOR_SECRET)
        .update(unsafePath)
        .digest("base64");

      const safeHash = hash.replace(/\+/gi, "-").replace(/\//gi, "_");
      const safeUrl = `${THUMBOR_ENDPOINT}/${safeHash}/${unsafePath}`;
      return safeUrl;
    }
  }
  return url;
};

export default transformUrlWithThumbor;
```

### Enable Private File Sharing

Private File Sharing by default is allowed for 24 hours. Private File Sharing is not used by default and allows a developer to create signed download url's for special cases.