import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
export const dynamic = 'force-static';

// llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
const { OPENAI_BASE_URL = 'http://127.0.0.1:8080/v1' } = process.env;

const provider = createOpenAICompatible({
  name: 'local',
  baseURL: OPENAI_BASE_URL,
});

export const imageModel = null; // provider.imageModel();
export const chatModel = provider.chatModel('gpt-oss');

export default provider;
