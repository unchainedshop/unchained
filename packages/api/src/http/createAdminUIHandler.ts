import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import mime from 'mime';
import { createLogger } from '@unchainedshop/logger';
import {
  buildImportMapTag,
  injectAdminUIImportMap,
  prepareAdminUIHTML,
  preparePluginAssets,
  resolveAdminUIHTML,
  resolveAdminUIPath,
  type AdminUIPluginConfig,
  type AdminUIThemeConfig,
} from './adminUiPlugins.ts';

const logger = createLogger('unchained:api:admin-ui');

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
const THEME_PATH = '/admin-ui-theme.css';
const NEXT_DEV_SERVER = 'http://localhost:3000';

export interface AdminUIOptions {
  prefix?: string;
  theme?: AdminUIThemeConfig;
  plugins?: AdminUIPluginConfig[];
}

const withCharset = (contentType: string) =>
  /^text\/|javascript|json/.test(contentType) ? `${contentType}; charset=utf-8` : contentType;

const conditionalResponse = (
  request: Request,
  body: BodyInit | null,
  headers: Record<string, string>,
) =>
  headers.etag && request.headers.get('if-none-match') === headers.etag
    ? new Response(null, {
        status: 304,
        headers: { etag: headers.etag, 'cache-control': headers['cache-control'] },
      })
    : new Response(request.method === 'HEAD' ? null : body, { headers });

const resolveThemeCSS = async (theme?: AdminUIThemeConfig) => {
  let css = '/* default theme */';
  if (theme) {
    try {
      const { generateThemeCSS } = await import(import.meta.resolve('@unchainedshop/admin-ui/theme'));
      css = generateThemeCSS(theme);
    } catch {
      logger.warn("npm dependency @unchainedshop/admin-ui is not installed, can't apply admin-ui theme");
    }
  }
  return { css, etag: `"${createHash('sha256').update(css).digest('hex').slice(0, 8)}"` };
};

const serveFile = async (request: Request, root: string, path: string) => {
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    return undefined;
  }
  if (decodedPath.split('/').some((segment) => segment.startsWith('.'))) return undefined;
  const filePath = resolve(root, `.${decodedPath}`);
  if (!filePath.startsWith(`${root}${sep}`)) return undefined;

  const stats = await stat(filePath).catch(() => undefined);
  if (!stats?.isFile()) return undefined;

  return conditionalResponse(request, request.method === 'HEAD' ? null : await readFile(filePath), {
    'cache-control': path.startsWith('/_next/static/') ? IMMUTABLE_CACHE : 'public, max-age=0',
    'content-type': withCharset(mime.getType(filePath) || 'application/octet-stream'),
    etag: `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`,
    'last-modified': stats.mtime.toUTCString(),
    'content-length': String(stats.size),
  });
};

export function createAdminUIHandler({ prefix = '/', theme, plugins = [] }: AdminUIOptions = {}) {
  const devMode = process.env.NODE_ENV !== 'production';
  const basePath = prefix.replace(/\/+$/, '');
  const root = resolveAdminUIPath();
  const {
    routes: assets,
    importMapTag,
    importMapJSON,
  } = preparePluginAssets(plugins, logger, { devMode });

  let html: ReturnType<typeof prepareAdminUIHTML> | undefined;
  try {
    html = root ? prepareAdminUIHTML(root) : undefined;
  } catch (error) {
    logger.error(error);
  }

  let themeCSS: ReturnType<typeof resolveThemeCSS> | undefined;
  let landingPage: string | undefined;

  const serve = async (request: Request, cspNonce?: string): Promise<Response | undefined> => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return undefined;
    const { pathname } = new URL(request.url);

    if (pathname === THEME_PATH) {
      const { css, etag } = await (themeCSS ??= resolveThemeCSS(theme));
      return conditionalResponse(request, css, {
        'cache-control': 'public, max-age=0, must-revalidate',
        'content-type': 'text/css; charset=utf-8',
        etag,
      });
    }

    const asset = assets.get(pathname);
    if (asset) {
      const content = typeof asset.content === 'function' ? asset.content() : asset.content;
      return conditionalResponse(request, content, {
        'cache-control': asset.cacheControl,
        'content-type': withCharset(asset.contentType),
        'x-content-type-options': 'nosniff',
        'access-control-allow-origin': '*',
        ...(asset.etag ? { etag: asset.etag } : {}),
      });
    }

    if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) return undefined;
    const path = pathname.slice(basePath.length) || '/';

    if (!html) {
      if (path !== '/') return undefined;
      if (root) return devMode ? Response.redirect(NEXT_DEV_SERVER, 302) : undefined;
      landingPage ??= readFileSync(new URL('../../index.html', import.meta.url), 'utf-8');
      return new Response(landingPage, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    const file = await serveFile(request, root!, path);
    const isPluginPage = path.startsWith('/ext/');
    const isFileRequest = path.includes('.') && !isPluginPage;
    if (file || isFileRequest) return file;

    const tag = importMapJSON && (cspNonce ? buildImportMapTag(importMapJSON, cspNonce) : importMapTag);
    const body = tag
      ? injectAdminUIImportMap(html, pathname, tag, prefix)
      : resolveAdminUIHTML(html, pathname, prefix);
    return new Response(request.method === 'HEAD' ? null : body, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
    });
  };
  return Object.assign(serve, { basePath, assetPaths: [THEME_PATH, ...assets.keys()] });
}
