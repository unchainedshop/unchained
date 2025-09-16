import Document, { Html, Head, Main, NextScript } from 'next/document';

const metaLinks = [
  {
    rel: 'icon',
    type: 'image/svg+xml',
    href: `/favicon.svg`,
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '196x196',
    href: `/icons/favicon-196.png`,
  },
  {
    rel: 'apple-touch-icon',
    href: `/icons/apple-icon-180.png`,
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2048-2732.jpg`,
    media:
      '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2732-2048.jpg`,
    media:
      '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2388-1668.jpg`,
    media:
      '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1536-2048.jpg`,
    media:
      '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2048-1536.jpg`,
    media:
      '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1668-2224.jpg`,
    media:
      '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2224-1668.jpg`,
    media:
      '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1620-2160.jpg`,
    media:
      '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2160-1620.jpg`,
    media:
      '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1284-2778.jpg`,
    media:
      '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2778-1284.jpg`,
    media:
      '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1170-2532.jpg`,
    media:
      '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2532-1170.jpg`,
    media:
      '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1125-2436.jpg`,
    media:
      '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2436-1125.jpg`,
    media:
      '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1242-2688.jpg`,
    media:
      '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2688-1242.jpg`,
    media:
      '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-828-1792.jpg`,
    media:
      '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1792-828.jpg`,
    media:
      '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1242-2208.jpg`,
    media:
      '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-2208-1242.jpg`,
    media:
      '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-750-1334.jpg`,
    media:
      '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1334-750.jpg`,
    media:
      '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-640-1136.jpg`,
    media:
      '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
  },
  {
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-1136-640.jpg`,
    media:
      '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
  },
];

const meta = {
  'og:description': 'Unchained e-commerce shop controller',
  'og:site_name': 'Admin UI',
  'og:url': 'https://unchained.shop',
  'og:image': '/icons/manifest-icon-512.maskable.png',
  'og:type': 'website',
  'og:title': 'Unchained Admin UI',
  'twitter:image': '/icons/manifest-icon-192.maskable.png',
  'twitter:creator': '@unchainedshop',
  'twitter:description': 'Unchained e-commerce shop controller',
  'twitter:card': 'summary',
  'twitter:url': 'https://unchained.shop',
  'twitter:title': 'Unchained Admin UI',
  'application-name': 'Unchained Admin UI',
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'default',
  'apple-mobile-web-app-title': 'Admin UI',
  description: 'Unchained e-commerce shop admin control',
  'format-detection': 'telephone=no',
  'mobile-web-app-capable': 'yes',
  'msapplication-config': '/icons/browserconfig.xml',
  'msapplication-TileColor': '#537bd8',
  'msapplication-tap-highlight': 'no',
  'theme-color': '#537bd8',
};

class MyDocument extends Document {
  render() {
    return (
      <Html className="h-full">
        <Head>
          {Object.entries(meta || {}).map(([key, value], i) => (
            <meta
              key={`${key}-${i}-${value}`}
              name={`${key}-${i}-${value}`}
              content={value}
            />
          ))}

          {(metaLinks || []).map((attr, i) => (
            <link key={`${attr?.href}-${attr.type}-${i}`} {...attr} />
          ))}
          <script
            src={`/admin-ui-permissions.js?v=${process.env.npm_package_version}`}
            id="role-config-script"
          />
        </Head>
        <body className="h-full bg-slate-50 dark:bg-slate-950 dark:text-slate-200">
          <noscript
            dangerouslySetInnerHTML={{
              __html: `
  <!--
   _____ _____ _____ _____ _____ _____ _____ _____ ____
  |  |  |   | |     |  |  |  _  |     |   | |   __|    \\
  |  |  | | | |   --|     |     |-   -| | | |   __|  |  |
  |_____|_|___|_____|__|__|__|__|_____|_|___|_____|____/

  - Technology, Engineering & Design by Unchained Commerce GmbH - https://unchained.shop

  -->
    `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
