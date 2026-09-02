import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import { createOpenAI } from '@ai-sdk/openai';
import { startPlatform } from '@unchainedshop/platform';
import { connect, unchainedLogger } from '@unchainedshop/api/fastify';
import { registerAllPlugins } from '@unchainedshop/plugins/presets/all';
import seed from './seed.ts';
import { useErrorHandler } from '@envelop/core';

import { HalfPriceManualPlugin } from '@unchainedshop/plugins/pricing/discount-half-price-manual';
import { HundredOffPlugin } from '@unchainedshop/plugins/pricing/discount-100-off';
import {
  registerProductDiscoverabilityFilter,
  pluginRegistry,
  type UnchainedCore,
} from '@unchainedshop/core';
import type { AdminUIThemeConfig } from '@unchainedshop/admin-ui/theme';
import { definePlugin } from '@unchainedshop/admin-ui/plugins';

const adminUITheme: AdminUIThemeConfig = {
  light: {
    accent: '#7c3aed',
    'accent-hover': '#6d28d9',
    'text-on-accent': '#ffffff',
    'focus-ring': 'rgba(124, 58, 237, 0.4)',
    'surface-subtle': '#faf5ff',
    'surface-raised': '#f3e8ff',
    border: '#c4b5fd',
    'border-subtle': '#ddd6fe',
    success: '#059669',
    danger: '#dc2626',
    warning: '#d97706',
  },
  dark: {
    accent: '#a78bfa',
    'accent-hover': '#c4b5fd',
    'text-on-accent': '#1e1b4b',
    'focus-ring': 'rgba(167, 139, 250, 0.4)',
    surface: '#1e1b4b',
    'surface-subtle': '#252262',
    'surface-raised': '#312e81',
    'surface-input': '#1e1b4b',
    border: '#4c1d95',
    'border-subtle': '#3b0764',
    'text-primary': '#ede9fe',
    'text-secondary': '#c4b5fd',
    'text-muted': '#a78bfa',
    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
  },
};

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

const provider =
  process.env.OPENAI_API_KEY &&
  createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const imageProvider =
  process.env.OPENAI_API_KEY &&
  createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

type UserRoleTarget = { _id: string; tags?: string[] };
type UserRoleParams = { userId?: string };
type UserRoleContext = { modules?: UnchainedCore['modules'] };

const userManagerRole = (role, actions) => {
  const findTargetUser = async (
    user: UserRoleTarget | null | undefined,
    params: UserRoleParams | null | undefined,
    context: UserRoleContext | null | undefined,
  ) => {
    if (user?._id) return user;
    if (!params?.userId || !context?.modules) return null;
    return context.modules.users.findUser({ userIds: [params.userId] });
  };
  const targetHasTag =
    (tag: string) =>
    async (
      user: UserRoleTarget | null | undefined,
      params: UserRoleParams | null | undefined,
      context: UserRoleContext | null | undefined,
    ) => {
      const targetUser = await findTargetUser(user, params, context);
      return targetUser?.tags?.includes(tag) ?? false;
    };
  const canEditTarget = async (
    user: UserRoleTarget | null | undefined,
    params: UserRoleParams | null | undefined,
    context: UserRoleContext | null | undefined,
  ) => {
    const targetUser = await findTargetUser(user, params, context);
    return (
      targetUser?.tags?.includes('permission-test-managed') ||
      targetUser?.tags?.includes('permission-test-disposable') ||
      false
    );
  };

  // Keep the user list and all read-only detail tabs available. The target-aware
  // actions below deliberately vary by seed-user tag so every UI state is easy to test.
  [
    actions.viewUsers,
    actions.viewUserCount,
    actions.viewUser,
    actions.viewUserPublicInfos,
    actions.viewUserPrivateInfos,
    actions.viewUserRoles,
    actions.viewUserOrders,
    actions.viewUserEnrollments,
    actions.viewUserQuotations,
    actions.viewUserProductReviews,
    actions.viewUserTokens,
  ].forEach((action) => role.allow(action, () => true));

  [
    actions.updateUser,
    actions.updateUsername,
    actions.uploadUserAvatar,
    actions.manageUsers,
    actions.logoutAllSessions,
    actions.impersonate,
  ].forEach((action) => role.allow(action, canEditTarget));

  role.allow(actions.removeUser, targetHasTag('permission-test-disposable'));
  role.allow(actions.sendEmail, () => true);
};

try {
  // Register all plugins before starting platform
  registerAllPlugins();

  // Register additional discount plugins
  pluginRegistry.register(HalfPriceManualPlugin);
  pluginRegistry.register(HundredOffPlugin);
  registerProductDiscoverabilityFilter({ hiddenTagValue: 'device' });

  const platform = await startPlatform({
    rolesOptions: {
      additionalRoles: {
        userManager: userManagerRole,
      },
    },
    plugins: [
      useErrorHandler(({ errors }) => {
        for (const error of errors) {
          const { code: errorCode } = (error as any).extensions || {};
          if (!errorCode) continue;
          (error as any).path?.map((path: string) => {
            fastify.log.error(`${error.message} (${path} -> ${error.name})`);
          });
        }
      }),
    ],
  });

  connect(fastify, platform, {
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
    chat: provider
      ? {
          model: provider.chat(process.env.OPENAI_MODEL || 'gpt-5.2'),
          imageGenerationTool: imageProvider
            ? { model: imageProvider.imageModel('gpt-image-1') }
            : undefined,
        }
      : undefined,
  });

  await seed(platform.unchainedAPI);

  // Warning: Do not use this in production - creates access token for bulk import API
  const result = await platform.unchainedAPI.modules.users.createAccessToken('admin');
  if (result) {
    fastify.log.info(`Access token for admin: ${result.token}`);
  }

  await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
