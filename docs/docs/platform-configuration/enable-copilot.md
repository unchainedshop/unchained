---
sidebar_position: 2
title: Enable AI Copilot (LLM) in Unchained Admin UI
sidebar_label: Activate Copilot
---

## Enable Unchained Admin UI with Copilot

In order to use the baked-in AI Copilot, you need to configure the Admin UI with a Vercel AI SDK model provider. To help you with that, we show you two ways:

### Self-hosted LLM Example (OpenAI API compatible)

If you have a beefy machine with at least 8GB of VRAM, you can run an LLM locally:
```
llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
export OPENAI_COMPAT_API_URL=http://127.0.0.1:8080/v1
export OPENAI_COMPAT_MODEL=gpt-oss
```

Else, you can choose any of the services or deploy your own LLM, it just needs to expose an OpenAI compatible API endpoint, and then you can connect the Admin UI with a pre-configured provider:


```ts
import { connectChat, fastifyRouter } from '@unchainedshop/admin-ui/fastify';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
...
connect(fastify...
...
if (process.env.OPENAI_COMPAT_API_URL && process.env.OPENAI_COMPAT_MODEL) {
  const provider = createOpenAICompatible({
    name: 'local',
    baseURL: process.env.OPENAI_COMPAT_API_URL,
  });
  connectChat(fastify, {
    model: provider.chatModel(process.env.OPENAI_COMPAT_MODEL)
  });
}
...
fastify.register(fastifyRouter, {
  prefix: '/',
});
...
```


### OpenAI Example

If you have an OpenAI API Key at hand, go this way:

```ts
import { connectChat, fastifyRouter } from '@unchainedshop/admin-ui/fastify';
import { openai } from '@ai-sdk/openai';
...
connect(fastify...
...
if (process.env.OPENAI_API_KEY) {
    connectChat(app, {
        model: openai('gpt-4-turbo'),
        imageGenerationTool: { model: openai.image('gpt-image-1') },
    });
}
...
fastify.register(fastifyRouter, {
  prefix: '/',
});
...
```

In this example we also enable an image model which allows the Copilot to generate product and category images.