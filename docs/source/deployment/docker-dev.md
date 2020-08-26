---
title: "Meteor in Docker"
description: An alternative approach to start the engine in dev mode
---

If you have issues installing or running meteor in your environment or you don't want to install the meteor cli on your computer, try it that way to ramp up a dev environment, copy this file here https://github.com/unchainedshop/unchained/blob/master/Dockerfile to your engine folder and run this from there:

```
docker build -f Dockerfile.dev -t unchained-local-dev .
docker run -it -p 4010:4010 -p 4011:4011 --mount type=bind,source="$(pwd)",target=/app unchained-local-dev
```
