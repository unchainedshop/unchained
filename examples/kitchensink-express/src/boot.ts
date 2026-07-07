import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import http from 'node:http';
import { startPlatform } from '@unchainedshop/platform';
import { connect } from '@unchainedshop/api/express';
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all';
import { createLogger } from '@unchainedshop/logger';
import seed from './seed.ts';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenAI } from '@ai-sdk/openai';
import { HalfPriceManualPlugin } from '@unchainedshop/plugins/pricing/discount-half-price-manual';
import { HundredOffPlugin } from '@unchainedshop/plugins/pricing/discount-100-off';
import { pluginRegistry } from '@unchainedshop/core';
import type { AdminUIThemeConfig } from '@unchainedshop/admin-ui/theme';
import { definePlugin } from '@unchainedshop/admin-ui/plugins';

const __dirname = dirname(fileURLToPath(import.meta.url));

const adminUITheme: AdminUIThemeConfig = {
  light: {
    accent: '#0d9488',
    'accent-hover': '#0f766e',
    'text-on-accent': '#ffffff',
    'focus-ring': 'rgba(13, 148, 136, 0.4)',
    'surface-subtle': '#f0fdfa',
    'surface-raised': '#ccfbf1',
    border: '#5eead4',
    'border-subtle': '#99f6e4',
    success: '#059669',
    danger: '#dc2626',
    warning: '#d97706',
  },
  dark: {
    accent: '#2dd4bf',
    'accent-hover': '#5eead4',
    'text-on-accent': '#042f2e',
    'focus-ring': 'rgba(45, 212, 191, 0.4)',
    surface: '#042f2e',
    'surface-subtle': '#0d3d3b',
    'surface-raised': '#134e4a',
    'surface-input': '#042f2e',
    border: '#115e59',
    'border-subtle': '#0f4c47',
    'text-primary': '#ccfbf1',
    'text-secondary': '#5eead4',
    'text-muted': '#2dd4bf',
    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
  },
};

const logger = createLogger('express');
const app = express();

// llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
const provider = process.env.OPENAI_BASE_URL && process.env.OPENAI_MODEL && createOpenAICompatible({
  name: 'local',
  baseURL: process.env.OPENAI_BASE_URL,
});

const imageProvider = process.env.OPENAI_API_KEY && createOpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

const httpServer = http.createServer(app);

try {
  // Register all plugins before starting platform
  registerAllPlugins();

  // Register additional discount plugins
  pluginRegistry.register(HalfPriceManualPlugin);
  pluginRegistry.register(HundredOffPlugin);

  const engine = await startPlatform({});

  connect(app, engine, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    adminUI: {
      theme: adminUITheme,
      plugins: [
        definePlugin({
          name: 'bookmark-manager',
          version: '1.0.0',
          bundlePath: resolve(__dirname, '../plugins/bookmark-manager/dist/index.global.js'),
          slots: {
            entities: [
              {
                path: '/bookmarks',
                label: 'Bookmarks',
                sortOrder: 75,
                requiredRole: 'viewProducts',
                icon: 'bookmark',
                components: {
                  list: 'BookmarkList',
                  detail: 'BookmarkDetail',
                  create: 'BookmarkCreate',
                },
              },
            ],
            'dashboard:widgets': [
              {
                component: 'BookmarkWidget',
                width: 'half',
              },
            ],
          },
        }),
      ],
    },
    chat: provider ? {
      model: provider.chatModel(process.env.OPENAI_MODEL),
      imageGenerationTool: imageProvider ? { model: imageProvider.imageModel('gpt-image-1') } : undefined,
    } : undefined,
  });

  // Seed Database
  await seed(engine.unchainedAPI);

  // Warning: Do not use this in production - creates access token for bulk import API
  const result = await engine.unchainedAPI.modules.users.createAccessToken('admin');
  if (result) {
    logger.info(`Access token for admin: ${result.token}`);
  }

  await httpServer.listen({ port: process.env.PORT || 3000 });
  logger.info(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
} catch (error) {
  logger.error(error);
  process.exit(1);
}
