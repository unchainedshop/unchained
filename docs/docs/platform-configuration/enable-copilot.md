---
sidebar_position: 2
title: Enable AI Copilot in Unchained Admin UI
sidebar_label: Activate Copilot
---

To use the built-in AI Copilot, you need to configure the Admin UI with a Vercel AI SDK model provider. To help you with that, we show you two ways: self-hosting and using OpenAI's models. For a complete list of providers and configuration options, please check [the AI SDK docs here](https://ai-sdk.dev/providers/ai-sdk-providers).

### Self-hosted LLM Example (OpenAI API compatible)

If you have a beefy machine with at least 24GB of VRAM, you can run an LLM locally. GPT-OSS 20B works just fine with its tool calling abilities:
```
llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
export OPENAI_COMPAT_API_URL=http://127.0.0.1:8080/v1
export OPENAI_COMPAT_MODEL=gpt-oss
```

Alternatively, you can choose any of the services or deploy your own LLM. It just needs to expose an OpenAI compatible API endpoint, and then you can connect the Admin UI with a pre-configured provider:

```ts
import { connect } from '@unchainedshop/api/fastify';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
...
connect(fastify...
...
if (process.env.OPENAI_COMPAT_API_URL && process.env.OPENAI_COMPAT_MODEL) {
  const provider = createOpenAICompatible({
    name: 'local',
    baseURL: process.env.OPENAI_COMPAT_API_URL,
  });
  connect(fastify, {
    chat: {
      model: provider.chatModel(process.env.OPENAI_COMPAT_MODEL)
    }
  });
}
...
```


### OpenAI Example

If you have an OpenAI API Key at hand, go this way:

```ts
import { connectChat } from '@unchainedshop/api/fastify';
import { openai } from '@ai-sdk/openai';
...
connect(fastify...
...
if (process.env.OPENAI_API_KEY) {
    connectChat(fastify, {
        model: openai('gpt-4-turbo'),
        imageGenerationTool: { model: openai.image('gpt-image-1') },
    });
}
...
```

In this example, we also enable an image model which allows the Copilot to generate product and category images.