---
sidebar_position: 3
title: Run Unchained Engine in Docker
sidebar_label: Run Unchained Engine in Docker
---
# Run Unchained Engine in Docker
:::
An alternative approach to start the engine in dev mode
:::


If you have issues installing or running the engine or you don't want to install the nodejs cli on your computer, try it that way to ramp up a dev environment, copy the Dockerfile from the unchained repository https://github.com/unchainedshop/unchained/blob/master/Dockerfile to your engine folder and run the Docker command from there:

```
docker build -f Dockerfile.dev -t unchained-local-dev .
docker run -it -p 4010:4010 -p 4011:4011 --mount type=bind,source="$(pwd)",target=/app unchained-local-dev
```