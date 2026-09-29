---
sidebar_position: 11
title: Ticket Renderers (PDF, Apple Wallet, Google Wallet)
sidebar_label: Ticket Renderers
description: Build the tickets PDF, Apple Wallet passes and Google Wallet passes for @unchainedshop/ticketing, with the pitfalls to avoid
---

# Ticket Renderers

`@unchainedshop/ticketing` serves the tickets PDF and the wallet passes, but it does not draw them. You pass up to three renderer functions to `createTicketingPlugin()`. A route whose renderer is missing answers `404`, so you can start with the PDF and add wallets later.

This guide builds all three step by step. The code is complete: copy it into your project, adjust the texts and the branding, and wire it up as shown in [Wiring](#wiring). It uses:

| Renderer | Library | Licence |
|----------|---------|---------|
| Tickets PDF | [`@react-pdf/renderer`](https://react-pdf.org) and [`qrcode`](https://www.npmjs.com/package/qrcode) | MIT |
| Apple Wallet | [`passkit-generator`](https://github.com/alexandercerutti/passkit-generator) 3.x | MIT |
| Google Wallet | [`googleapis`](https://www.npmjs.com/package/googleapis) (Wallet REST API) | Apache-2.0 |

```bash
npm install @react-pdf/renderer react qrcode passkit-generator googleapis
npm install --save-dev @types/qrcode @types/react
# Pushes updated Apple passes to the devices that saved them
npm install @parse/node-apn
```

:::caution `@walletpass/pass-js`
Earlier versions of these docs pointed to `@walletpass/pass-js`. It is licensed AGPL-3.0-or-later since 7.0.1. Use `passkit-generator` (MIT) as shown here, or pin a release whose licence you accept.
:::

The setup of the package itself (plugin, ticket issuer, gate staff) is in [Event Ticketing](./ticketing-setup).

## The renderer contracts

| Option of `createTicketingPlugin()` | Type | Called by | Returns |
|------|------|-----------|---------|
| `renderOrderPDF` | `PDFRenderer` | `GET /rest/print_tickets?orderId&otp[&variant]` | a Node.js readable stream of the PDF |
| `createAppleWalletPass` | `PassRenderer` | `GET /rest/apple-wallet/download/<tokenId>.pkpass?hash=`, and again when a ticket with a saved pass is redeemed or cancelled | `{ serialNumber, passTypeIdentifier, asBuffer(), asURL() }` |
| `createGoogleWalletPass` | `GoogleWalletPassRenderer` | `GET /rest/google-wallet/download/<tokenId>?hash=` | the "Add to Google Wallet" link as a string or as `{ asURL() }`; the route redirects to it with `302`, `null` answers `404` |

The types are exported from `@unchainedshop/ticketing`. The second argument is the request context on the routes and the Unchained API when a pass is refreshed in the background; both carry `modules` and `services`.

The routes check access before they call you: the print route requires `viewOrder` (the order owner, an admin, or the order's magic key as `otp`), the wallet routes require the ticket's access key as `hash`. See [Delivering tickets](./ticketing-setup#delivering-tickets) for the links.

## One QR code for all renderers

Every ticket carries the same QR code, whether it is printed, in Apple Wallet or in Google Wallet:

```text
<scanBaseUrl>/<tokenId>?hash=<accessKey>
```

- `buildTicketScanPayload({ tokenId, accessKey }, { baseUrl })` builds it.
- `accessKey` is `modules.warehousing.buildAccessKeyFromToken(token)`. It changes when the ticket changes hands: the PDF and a newly downloaded pass then carry the new code, the old one no longer opens the ticket page.
- `scanBaseUrl` is a page of your storefront that shows the ticket, for example `https://shop.example.com/tickets`. Someone who scans the code with a phone camera lands on that page; the gate scanner of the Admin UI reads the token id from it.
- `parseTicketScanPayload(text)` reads it back. It also understands the older formats `unchained-scanner://<tokenId>?hash=…` and `unchained://ticket/<tokenId>?hash=…`, so tickets already issued keep scanning.

Projects that used a different payload per renderer (`unchained-scanner://…` in one wallet, `unchained://ticket/…` in another, a storefront URL on the PDF) ended up with scanners that could not read all of their own tickets. Use the helper everywhere.

The three renderers share one data loader:

```ts title="src/tickets/ticket-data.ts"
import type { UnchainedCore } from '@unchainedshop/core';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import {
  TicketStatus,
  buildTicketScanPayload,
  getTicketEventDetails,
  getTicketStatus,
  isTicketEventCancelled,
} from '@unchainedshop/ticketing';

export interface TicketDataOptions {
  /** Where the QR code points to, e.g. the ticket page of your storefront: https://shop.example.com/tickets */
  scanBaseUrl: string;
  /** Language of the product texts, e.g. 'de' */
  locale: string;
}

/** Everything the three renderers print about one ticket. */
export async function loadTicketData(
  token: TokenSurrogate,
  { modules }: UnchainedCore,
  { scanBaseUrl, locale }: TicketDataOptions,
) {
  const product = await modules.products.findProduct({ productId: token.productId });
  if (!product) throw new Error(`Event ${token.productId} of ticket ${token._id} not found`);
  const texts = await modules.products.texts.findLocalizedText({
    productId: product._id,
    locale: new Intl.Locale(locale),
  });
  // The one QR payload every renderer uses, so one scanner reads PDF and wallet tickets alike.
  const accessKey = await modules.warehousing.buildAccessKeyFromToken(token);
  const attendeeName = token.meta?.attendeeName;

  return {
    token,
    product,
    title: texts?.title || product._id,
    subtitle: texts?.subtitle || undefined,
    // startsAt, endsAt, doorsOpenAt, location, category (only valid values)
    event: getTicketEventDetails(product),
    // VALID, REDEEMED or CANCELLED; a cancelled event cancels all its tickets
    status: isTicketEventCancelled(product) ? TicketStatus.CANCELLED : getTicketStatus(token),
    attendeeName: typeof attendeeName === 'string' && attendeeName.trim() ? attendeeName.trim() : undefined,
    scanPayload: buildTicketScanPayload({ tokenId: token._id, accessKey }, { baseUrl: scanBaseUrl }),
  };
}

export type TicketData = Awaited<ReturnType<typeof loadTicketData>>;
```

`getTicketEventDetails(product)` reads the event facts from `tokenization.ercMetadataProperties` (`slot`, `location`, `durationMinutes`, `doorsOpenMinutesBefore`, `category`) and falls back to `product.meta.slot` / `product.meta.location` for older events. `attendeeName` is only there if your ticket issuer's `ticketMeta` hook stored one.

## Tickets PDF

One page per ticket, in A4 or, with `?variant=receipt`, on 80 mm receipt paper. Redeemed tickets get a stamp, cancelled tickets get a stamp instead of the QR code.

Node.js runs `.ts` files natively but cannot run JSX, so the layout below uses `createElement` (`h`). If your project compiles TSX, write the same tree in JSX.

```ts title="src/tickets/pdf.ts"
import { createElement as h } from 'react';
import ReactPDF, { Document, Font, Image, Page, StyleSheet, Text } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { TicketStatus, type PDFRenderer } from '@unchainedshop/ticketing';
import { loadTicketData, type TicketData, type TicketDataOptions } from './ticket-data.ts';

export interface TicketsPdfOptions extends TicketDataOptions {
  /** Static TTF or OTF files on disk: no variable fonts, no URLs (see pitfalls) */
  fonts: { regular: string; bold: string };
  /** PNG or JPEG file; react-pdf cannot draw SVG */
  logoPath?: string;
  timeZone: string;
  labels?: { ticket: string; doors: string; attendee: string; order: string; redeemed: string; cancelled: string };
}

// ?variant=receipt prints one ticket per 80 mm receipt page, everything else one per A4 page.
const RECEIPT_PAGE_SIZE: [number, number] = [226.77, 425.2]; // 80 x 150 mm in points
const isReceipt = (variant?: string) => variant === 'receipt' || variant === 'starprnt';

const styles = StyleSheet.create({
  page: { fontFamily: 'TicketFont', fontSize: 11, padding: 36 },
  receiptPage: { fontFamily: 'TicketFont', fontSize: 9, padding: 12 },
  logo: { width: 120, marginBottom: 24, objectFit: 'contain' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  line: { marginBottom: 2 },
  qrCode: { width: 180, height: 180, marginVertical: 16 },
  serial: { fontSize: 18, fontWeight: 700 },
  stamp: { fontSize: 28, fontWeight: 700, color: '#b00020', marginVertical: 16 },
  muted: { color: '#666666', marginTop: 12 },
});

export function createTicketsPdfRenderer(options: TicketsPdfOptions): PDFRenderer {
  const labels = {
    ticket: 'Ticket',
    doors: 'Doors',
    attendee: 'Attendee',
    order: 'Order',
    redeemed: 'REDEEMED',
    cancelled: 'CANCELLED',
    ...options.labels,
  };
  const formatDateTime = new Intl.DateTimeFormat(options.locale, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: options.timeZone, // servers run in UTC, the audience does not
  });
  const formatTime = new Intl.DateTimeFormat(options.locale, {
    timeStyle: 'short',
    timeZone: options.timeZone,
  });

  let fontsRegistered = false;
  const registerFonts = () => {
    if (fontsRegistered) return;
    Font.register({
      family: 'TicketFont',
      fonts: [
        { src: options.fonts.regular, fontWeight: 400 },
        { src: options.fonts.bold, fontWeight: 700 },
      ],
    });
    // react-pdf hyphenates English rules by default, which breaks names and German words.
    Font.registerHyphenationCallback((word) => [word]);
    fontsRegistered = true;
  };

  const TicketPage = ({
    ticket,
    qrCode,
    orderNumber,
    receipt,
  }: {
    ticket: TicketData;
    qrCode: string;
    orderNumber?: string;
    receipt: boolean;
  }) => {
    const { startsAt, doorsOpenAt, location } = ticket.event;
    const stamp =
      (ticket.status === TicketStatus.CANCELLED && labels.cancelled) ||
      (ticket.status === TicketStatus.REDEEMED && labels.redeemed);
    return h(
      Page,
      receipt ? { size: RECEIPT_PAGE_SIZE, style: styles.receiptPage } : { size: 'A4', style: styles.page },
      !receipt && options.logoPath ? h(Image, { src: options.logoPath, style: styles.logo }) : null,
      h(Text, { style: styles.title }, ticket.title),
      ticket.subtitle ? h(Text, { style: styles.line }, ticket.subtitle) : null,
      startsAt ? h(Text, { style: styles.line }, formatDateTime.format(startsAt)) : null,
      doorsOpenAt ? h(Text, { style: styles.line }, `${labels.doors}: ${formatTime.format(doorsOpenAt)}`) : null,
      location ? h(Text, { style: styles.line }, location) : null,
      ticket.attendeeName ? h(Text, { style: styles.line }, `${labels.attendee}: ${ticket.attendeeName}`) : null,
      // A cancelled ticket must not look valid: no QR code, only the stamp.
      ticket.status === TicketStatus.CANCELLED ? null : h(Image, { src: qrCode, style: styles.qrCode }),
      stamp ? h(Text, { style: styles.stamp }, stamp) : null,
      h(Text, { style: styles.serial }, `${labels.ticket} #${ticket.token.tokenSerialNumber}`),
      orderNumber ? h(Text, { style: styles.muted }, `${labels.order} ${orderNumber}`) : null,
    );
  };

  return async ({ orderId, variant }, context) => {
    registerFonts();
    const { modules } = context;
    const order = await modules.orders.findOrder({ orderId });
    // Tickets hang off the order positions, whichever warehousing adapter issued them.
    const positions = await modules.orders.positions.findOrderPositions({ orderId });
    const tokens = positions.length
      ? await modules.warehousing.findTokens({
          orderPositionId: { $in: positions.map(({ _id }) => _id) },
        })
      : [];
    tokens.sort(
      (a, b) =>
        a.productId.localeCompare(b.productId) ||
        a.tokenSerialNumber.localeCompare(b.tokenSerialNumber, undefined, { numeric: true }),
    );

    const pages = await Promise.all(
      tokens.map(async (token) => {
        const ticket = await loadTicketData(token, context, options);
        const qrCode = await QRCode.toDataURL(ticket.scanPayload, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 512,
        });
        return h(TicketPage, {
          key: token._id,
          ticket,
          qrCode,
          orderNumber: order?.orderNumber,
          receipt: isReceipt(variant),
        });
      }),
    );

    // react-pdf needs at least one page
    const document = h(
      Document,
      { title: `Tickets ${order?.orderNumber || orderId}` },
      pages.length ? pages : h(Page, { size: 'A4', style: styles.page }, h(Text, null, 'No tickets')),
    );
    return ReactPDF.renderToStream(document);
  };
}
```

**The `variant` parameter.** The print route passes `?variant=` through unchanged, so you decide which values exist. The example accepts `receipt` (and `starprnt`, a value existing box office bookmarks use) for receipt printers and falls back to A4 for anything else. `Order.ticketsPdfUrl(variant: "receipt")` and `buildTicketsPdfUrl(orderId, context, { variant })` build such links.

Pitfalls seen in production renderers:

- **Fonts from URLs.** Registering a Google Fonts URL downloads the font on the first render of every process and fails when the server has no outbound access. Ship the font files with your app.
- **Variable fonts.** react-pdf only renders the default instance of a variable font (`Jost-VF.ttf`), so bold text stays regular. Use one static file per weight.
- **SVG logos.** `Image` draws PNG and JPEG only. Convert SVG logos once, for example with `sharp`, instead of on every render.
- **Time zones.** Containers run in UTC. Without `timeZone`, a 19:00 show prints as 17:00.
- **Finding the tickets.** Load them through the order positions as above. `findTokens({ 'meta.orderId': orderId })` only finds tickets of adapters that write `meta.orderId`.
- **Cancelled and redeemed tickets** were printed like valid ones. Check `status` (above) and never print a QR code on a cancelled ticket.
- **Awaiting the QR code.** `QRCode.toDataURL()` returns a promise. Await it instead of handing the promise to `Image`.
- **Hyphenation.** react-pdf hyphenates with English rules and splits names and German compounds; disable it as shown or supply your own callback.

## Apple Wallet

### Certificates

1. In your Apple Developer account, open **Certificates, Identifiers & Profiles → Identifiers**, add a **Pass Type ID** (for example `pass.com.example.tickets`) and note your **Team ID**.
2. Select the Pass Type ID, choose **Create Certificate** and upload a certificate signing request:

   ```bash
   openssl req -new -newkey rsa:2048 -nodes -keyout pass.key -out pass.csr \
     -subj "/emailAddress=tickets@example.com/CN=Example Tickets/C=CH"
   ```

   Download the certificate (`pass.cer`).
3. Convert it into one PEM file that holds the certificate and the encrypted private key. The renderer signs passes with it, and the engine uses the same file to push pass updates:

   ```bash
   openssl x509 -inform der -in pass.cer -out pass-cert.pem
   openssl pkcs8 -topk8 -v2 aes-256-cbc -in pass.key -out pass-key.pem   # asks for a passphrase
   cat pass-cert.pem pass-key.pem > pass.pem
   ```

   If you created the certificate with Keychain instead, export certificate and key together as `Certificates.p12` and convert that:

   ```bash
   openssl pkcs12 -in Certificates.p12 -legacy -clcerts -out pass.pem   # asks for the p12 password, then a PEM passphrase
   ```

4. Download Apple's WWDR intermediate certificate (G4) and convert it:

   ```bash
   curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
   openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem
   ```

5. Keep `pass.pem` and `wwdr.pem` out of the repository (mount them as secrets) and configure:

   | Variable | Used by | Value |
   |----------|---------|-------|
   | `PASS_CERTIFICATE_PATH` | renderer and push updates | path to `pass.pem` |
   | `PASS_CERTIFICATE_SECRET` | renderer and push updates | the PEM passphrase |
   | `PASS_WWDR_CERTIFICATE_PATH` | renderer (your own variable) | path to `wwdr.pem` |
   | `PASS_TYPE_IDENTIFIER`, `PASS_TEAM_ID` | renderer (your own variables) | `pass.com.example.tickets`, your Team ID |

Pass certificates expire (`openssl x509 -enddate -noout -in pass.pem`). Renew yours in time: with an expired certificate new passes fail to install and saved passes stop receiving updates.

### The pass model

`passkit-generator` starts from a model folder whose name ends in `.pass`. It holds the static parts of the pass:

```text
wallet/ticket.pass/
  pass.json
  icon.png      29 x 29    (required)
  icon@2x.png   58 x 58
  icon@3x.png   87 x 87
  logo.png      max. 160 x 50
  logo@2x.png   max. 320 x 100
```

```json title="wallet/ticket.pass/pass.json"
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.example.tickets",
  "teamIdentifier": "ABCDE12345",
  "organizationName": "Example Events",
  "description": "Event ticket",
  "logoText": "Example Events",
  "backgroundColor": "rgb(20,20,20)",
  "foregroundColor": "rgb(255,255,255)",
  "labelColor": "rgb(170,170,170)",
  "eventTicket": {}
}
```

### The renderer

```ts title="src/tickets/apple-wallet.ts"
import { readFile } from 'node:fs/promises';
import { PKPass } from 'passkit-generator';
import {
  TicketStatus,
  buildWalletPassUrls,
  getTicketingPaths,
  type PassRenderer,
  type TicketingAPI,
} from '@unchainedshop/ticketing';
import { loadTicketData, type TicketDataOptions } from './ticket-data.ts';

export interface AppleWalletPassOptions extends TicketDataOptions {
  /** Folder named *.pass with pass.json and the icon/logo images */
  modelPath: string;
  /** PEM file with the Pass Type ID certificate and its private key (also used for push updates) */
  certificatePath: string;
  certificatePassphrase?: string;
  /** Apple WWDR intermediate certificate (G4), PEM */
  wwdrCertificatePath: string;
  passTypeIdentifier: string;
  teamIdentifier: string;
  /** Formats the dates printed on the pass */
  timeZone: string;
  /** Where the lock screen suggests the pass. Latitude first: 47.37, longitude 8.54 is Zurich. */
  locations?: { latitude: number; longitude: number; relevantText?: string }[];
}

// Returns the first PEM block of one type, so one file can hold the certificate and the key.
const pemBlock = (pem: string, type: string) =>
  pem.match(new RegExp(`-----BEGIN ${type}-----[\\s\\S]+?-----END ${type}-----`))?.[0];

export function createAppleWalletPassRenderer(options: AppleWalletPassOptions): PassRenderer {
  const { passTypeIdentifier, teamIdentifier, timeZone, locations = [] } = options;
  // Devices call the PassKit web service of @unchainedshop/ticketing here to fetch updated passes.
  const rootUrl = (process.env.ROOT_URL || 'http://localhost:4010').replace(/\/+$/, '');
  const webServiceURL = `${rootUrl}${getTicketingPaths().appleWallet}`;

  let certificates: ReturnType<typeof loadCertificates> | undefined;
  async function loadCertificates() {
    const [pem, wwdr] = await Promise.all([
      readFile(options.certificatePath, 'utf8'),
      readFile(options.wwdrCertificatePath, 'utf8'),
    ]);
    const signerCert = pemBlock(pem, 'CERTIFICATE');
    const signerKey =
      pemBlock(pem, 'ENCRYPTED PRIVATE KEY') ||
      pemBlock(pem, 'PRIVATE KEY') ||
      pemBlock(pem, 'RSA PRIVATE KEY');
    if (!signerCert || !signerKey) {
      throw new Error(`${options.certificatePath} needs the pass certificate and its private key`);
    }
    return { wwdr, signerCert, signerKey, signerKeyPassphrase: options.certificatePassphrase };
  }

  const formatDate = new Intl.DateTimeFormat(options.locale, { dateStyle: 'medium', timeZone });
  const formatTime = new Intl.DateTimeFormat(options.locale, { timeStyle: 'short', timeZone });

  return async (token, context) => {
    const ticket = await loadTicketData(token, context, options);
    const { startsAt, endsAt, doorsOpenAt, location, category } = ticket.event;

    certificates ??= loadCertificates();
    const pass = await PKPass.from(
      { model: options.modelPath, certificates: await certificates },
      {
        passTypeIdentifier,
        teamIdentifier,
        // Stable per ticket: registrations and updates are keyed by it. Not the access key,
        // which changes when the ticket changes hands.
        serialNumber: token._id,
        // The web service of @unchainedshop/ticketing accepts exactly `ApplePass <token._id>`.
        authenticationToken: token._id,
        // Wallet only accepts https web services; leave it out in local development.
        ...(webServiceURL.startsWith('https://') && { webServiceURL }),
        // Redeemed and cancelled tickets are re-rendered by the ticketing plugin and show as void.
        voided: ticket.status !== TicketStatus.VALID,
      },
    );

    pass.setBarcodes({
      format: 'PKBarcodeFormatQR',
      message: ticket.scanPayload,
      messageEncoding: 'iso-8859-1',
      altText: `#${token.tokenSerialNumber}`,
    });
    if (startsAt) {
      pass.setRelevantDate(doorsOpenAt || startsAt);
      // Moves the pass to "expired" in Wallet some hours after the show
      pass.setExpirationDate(new Date((endsAt || startsAt).getTime() + 6 * 60 * 60 * 1000));
    }
    if (locations.length) pass.setLocations(...locations);

    const [eventTicket] = pass.types; // from "eventTicket": {} in pass.json
    if (startsAt) {
      eventTicket.headerFields.push({
        key: 'date',
        label: formatDate.format(startsAt),
        value: formatTime.format(startsAt),
        changeMessage: 'The event now starts at %@',
      });
    }
    eventTicket.primaryFields.push({ key: 'event', label: 'Event', value: ticket.title });
    if (location) eventTicket.secondaryFields.push({ key: 'location', label: 'Location', value: location });
    eventTicket.secondaryFields.push({
      key: 'ticket',
      label: 'Ticket',
      value: `#${token.tokenSerialNumber}`,
    });
    if (ticket.attendeeName) {
      eventTicket.auxiliaryFields.push({ key: 'attendee', label: 'Attendee', value: ticket.attendeeName });
    }
    if (doorsOpenAt) {
      eventTicket.auxiliaryFields.push({ key: 'doors', label: 'Doors', value: formatTime.format(doorsOpenAt) });
    }
    if (category) eventTicket.auxiliaryFields.push({ key: 'category', label: 'Category', value: category });
    if (ticket.status !== TicketStatus.VALID) {
      eventTicket.backFields.push({ key: 'status', label: 'Status', value: ticket.status });
    }

    return {
      serialNumber: token._id,
      passTypeIdentifier,
      asBuffer: async () => pass.getAsBuffer(),
      // The download link of this pass (the renderer contract asks for one; the route serves the file)
      asURL: async () => (await buildWalletPassUrls(token, context as TicketingAPI)).appleWallet!,
    };
  };
}
```

### Updates and voiding

The plugin stores every rendered pass as a file and implements Apple's PassKit web service under `APPLE_WALLET_WEBSERVICE_PATH` (default `/rest/apple-wallet`):

1. The pass carries `webServiceURL = ROOT_URL + APPLE_WALLET_WEBSERVICE_PATH` (`getTicketingPaths().appleWallet`) and `authenticationToken = token._id`. When someone adds the pass, the device registers itself there.
2. When a ticket is redeemed (`scanTicket`) or cancelled (`cancelTicket`, `cancelEvent`), the plugin renders its stored pass again, now with `voided: true`, and pushes a notification through APNs to the registered devices.
3. The device then downloads the new version from the web service.

For step 2, install `@parse/node-apn` and set `PASS_CERTIFICATE_PATH` / `PASS_CERTIFICATE_SECRET` as above. Without them the pass is re-rendered but devices only see the change when they refresh the pass themselves. `ROOT_URL` must be the public `https://` URL of the engine, and `APPLE_WALLET_WEBSERVICE_PATH` must not change once passes are out: saved passes keep the URL they were issued with.

Changing an event's details (`updateTicketEvent`) or transferring a ticket to someone else does not re-render saved passes; the new version is rendered when the pass is downloaded again.

### Pitfalls

- **`serialNumber` must be stable.** Renderers have used the access key as serial number. It changes when a ticket is transferred, which orphans the device registrations of the old pass and leaves a second pass file behind. Use `token._id`.
- **`authenticationToken`** must be `token._id`: the web service compares the `Authorization: ApplePass …` header with it. Apple requires at least 16 characters, which ticket ids have.
- **Latitude and longitude.** A production pass had them swapped (latitude 8.8, longitude 47.3), which moves a Swiss venue to the Horn of Africa. Latitude comes first.
- **`http` web service URLs.** Wallet only accepts `https` web services, unless "Allow HTTP Services" is switched on in the developer settings of the device, and refuses such passes otherwise. Only set `webServiceURL` when `ROOT_URL` is `https`, as above.
- **Environment at import time.** Renderers that read the certificate and `APPLE_WALLET_WEBSERVICE_PATH` when their module is imported miss values that are loaded later. Read them in the factory, as above, so the values from your `.env` files and secrets are used.

## Google Wallet

### Issuer and credentials

1. Create an issuer account in the [Google Pay & Wallet Console](https://pay.google.com/business/console) and note the **issuer id**.
2. In a Google Cloud project, enable the **Google Wallet API** and create a **service account** with a JSON key.
3. In the Pay & Wallet Console, add the service account's e-mail under **Users** so it may manage passes of your issuer.
4. Provide the JSON key as a secret, never as a file in the repository; rotate a key that was ever committed. The wiring below reads it from `GOOGLE_WALLET_CREDENTIALS`; with a loader like `examples/ticketing/load_env.js` (`node --import ./load_env.js boot.ts`), `GOOGLE_WALLET_CREDENTIALS_FILE=/run/secrets/google-wallet.json` fills that variable from a mounted secret.

Until Google approves your issuer for production, only the test accounts you add in the console can save passes.

### The renderer

A pass consists of a **class** (one per event) and an **object** (one per ticket). The renderer upserts both through the REST API and returns a link with a signed JWT that references the object.

```ts title="src/tickets/google-wallet.ts"
import { createSign } from 'node:crypto';
import { google, type walletobjects_v1 } from 'googleapis';
import type { UnchainedCore } from '@unchainedshop/core';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { subscribe, type RawPayloadType } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import {
  TicketStatus,
  TicketingEventTypes,
  registerTicketingEvents,
  type GoogleWalletPassRenderer,
  type TicketCancelledEventPayload,
  type TicketEventCancelledEventPayload,
  type TicketRedeemedEventPayload,
} from '@unchainedshop/ticketing';
import { loadTicketData, type TicketDataOptions } from './ticket-data.ts';

export interface GoogleWalletOptions extends TicketDataOptions {
  issuerId: string;
  /** The service account key (JSON) with access to the issuer, read from a secret */
  credentials: { client_email: string; private_key: string };
  /** Keeps staging and production apart when they share an issuer, e.g. 'staging-' */
  idPrefix?: string;
  issuerName: string;
  /** PNG or JPEG over https; Google rejects SVG */
  logoUrl: string;
  hexBackgroundColor?: string;
  /** Storefront origins that show the "Add to Google Wallet" button (not needed for plain links) */
  origins?: string[];
}

const logger = createLogger('google-wallet');

const isNotFound = (error: unknown) => (error as { status?: number })?.status === 404;

export function createGoogleWallet(options: GoogleWalletOptions) {
  const { issuerId, credentials, idPrefix = '', issuerName, locale } = options;
  const client = google.walletobjects({
    version: 'v1',
    auth: new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
    }),
  });

  // Ids are unique per issuer and may only contain letters, digits, '.', '_' and '-'.
  const toId = (value: string) => `${issuerId}.${`${idPrefix}${value}`.replace(/[^\w.-]/g, '_')}`;
  // One class per event, one object per ticket. Key objects by token._id: serials restart for
  // every event, so serial-based ids let tickets of different events overwrite each other.
  const classIdOf = (productId: string) => toId(`event-${productId}`);
  const objectIdOf = (tokenId: string) => toId(`ticket-${tokenId}`);
  const localized = (value: string) => ({ defaultValue: { language: locale, value } });

  async function upsertClass(id: string, body: walletobjects_v1.Schema$EventTicketClass) {
    try {
      await client.eventticketclass.patch({ resourceId: id, requestBody: body });
    } catch (error) {
      if (!isNotFound(error)) throw error;
      await client.eventticketclass.insert({ requestBody: { ...body, id } });
    }
  }

  async function upsertObject(id: string, body: walletobjects_v1.Schema$EventTicketObject) {
    try {
      await client.eventticketobject.patch({ resourceId: id, requestBody: body });
    } catch (error) {
      if (!isNotFound(error)) throw error;
      await client.eventticketobject.insert({ requestBody: { ...body, id } });
    }
  }

  // The "Add to Google Wallet" link: a JWT signed with the service account key (RS256).
  function buildSaveLink(objectId: string) {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const claims = {
      iss: credentials.client_email,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      ...(options.origins && { origins: options.origins }),
      payload: { eventTicketObjects: [{ id: objectId }] },
    };
    const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(claims)}`;
    const signature = createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key, 'base64url');
    return `https://pay.google.com/gp/v/save/${unsigned}.${signature}`;
  }

  const createGoogleWalletPass: GoogleWalletPassRenderer = async (token, context) => {
    const ticket = await loadTicketData(token, context, options);
    const { startsAt, endsAt, doorsOpenAt, location } = ticket.event;
    const classId = classIdOf(ticket.product._id);

    await upsertClass(classId, {
      issuerName,
      reviewStatus: 'UNDER_REVIEW',
      eventName: localized(ticket.title),
      logo: { sourceUri: { uri: options.logoUrl } },
      hexBackgroundColor: options.hexBackgroundColor,
      ...(startsAt && {
        dateTime: {
          start: startsAt.toISOString(),
          end: endsAt?.toISOString(),
          doorsOpen: doorsOpenAt?.toISOString(),
        },
      }),
      ...(location && { venue: { name: localized(location), address: localized(location) } }),
    });

    const objectId = objectIdOf(token._id);
    await upsertObject(objectId, {
      classId,
      // Rendering again must not bring a redeemed or cancelled ticket back to life.
      state: ticket.status === TicketStatus.VALID ? 'ACTIVE' : 'EXPIRED',
      ticketNumber: token.tokenSerialNumber,
      ticketHolderName: ticket.attendeeName,
      barcode: {
        type: 'QR_CODE',
        value: ticket.scanPayload,
        alternateText: `#${token.tokenSerialNumber}`,
      },
    });

    return buildSaveLink(objectId);
  };

  // Tickets someone never saved have no object: 404 is fine here.
  async function patchSavedObject(token: TokenSurrogate, body: walletobjects_v1.Schema$EventTicketObject) {
    try {
      await client.eventticketobject.patch({ resourceId: objectIdOf(token._id), requestBody: body });
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }
  }

  /**
   * Keeps saved Google passes in sync: redeemed and cancelled tickets expire, a cancelled event
   * gets a message, a ticket that changed hands gets the QR code with the new access key.
   * Call it once after startPlatform.
   */
  function subscribeToTicketEvents(unchainedAPI: UnchainedCore) {
    registerTicketingEvents();
    // Event listeners are not awaited: never let a Google API error become an unhandled rejection.
    const safely =
      <T>(handler: (payload: T) => Promise<void>) =>
      async ({ payload }: RawPayloadType<T>) => {
        try {
          await handler(payload);
        } catch (error) {
          logger.error('Google Wallet sync failed', error);
        }
      };

    subscribe(
      TicketingEventTypes.TICKET_REDEEMED,
      safely<TicketRedeemedEventPayload>(({ token }) => patchSavedObject(token, { state: 'EXPIRED' })),
    );
    subscribe(
      TicketingEventTypes.TICKET_CANCELLED,
      safely<TicketCancelledEventPayload>(({ token }) => patchSavedObject(token, { state: 'EXPIRED' })),
    );
    subscribe(
      TicketingEventTypes.TICKET_EVENT_CANCELLED,
      safely<TicketEventCancelledEventPayload>(async ({ productId }) => {
        try {
          await client.eventticketclass.addmessage({
            resourceId: classIdOf(productId),
            requestBody: { message: { header: 'Cancelled', body: 'This event has been cancelled.' } },
          });
        } catch (error) {
          if (!isNotFound(error)) throw error;
        }
      }),
    );
    // The access key in the QR code depends on the owner.
    subscribe(
      'TOKEN_OWNERSHIP_CHANGED',
      safely<{ token: TokenSurrogate }>(async ({ token }) => {
        const ticket = await loadTicketData(token, unchainedAPI, options);
        await patchSavedObject(token, {
          barcode: {
            type: 'QR_CODE',
            value: ticket.scanPayload,
            alternateText: `#${token.tokenSerialNumber}`,
          },
        });
      }),
    );
  }

  return { createGoogleWalletPass, subscribeToTicketEvents };
}
```

The ticketing events fire for every redemption through `scanTicket` (`TICKET_REDEEMED`) and for every cancelled ticket (`TICKET_CANCELLED`, also for each ticket of a cancelled event, followed by one `TICKET_EVENT_CANCELLED`). The core `invalidateToken` mutation does not emit `TICKET_REDEEMED`. With several engine instances behind a shared event emitter (Redis, EventBridge), every instance receives the events and sends the same idempotent `PATCH`.

### Pitfalls

- **Object ids from the serial number.** Renderers have used `issuerId.tokenSerialNumber`. Serial numbers start again for every event, so ticket #12 of one event overwrote ticket #12 of another, including its QR code: one customer's wallet showed another customer's valid ticket. Use `token._id`. Passes already saved under serial-based ids cannot be mapped back; re-issue links.
- **Never expired.** Renderers had an `expireObject` function that nothing called, and every render wrote `state: 'ACTIVE'`, so asking for the link again revived a redeemed ticket. Subscribe to the ticketing events and derive the state from the ticket, as above.
- **Barcode on the class.** `EventTicketClass` has no `barcode` field, and one class serves all tickets of an event anyway. The barcode belongs on each ticket's object.
- **SVG logos.** Google Wallet rejects SVG images. Use PNG or JPEG over `https`.
- **One issuer for staging and production.** Class and object ids are global per issuer. Without `idPrefix`, a staging system on a copy of the production database overwrites production passes.
- **`origins: ['www.example.com']`.** A copied placeholder. `origins` is only needed for the JavaScript "Add to Google Wallet" button; the plain link used by the download route works without it.
- **`reviewStatus`.** Updating a class requires `UNDER_REVIEW` (or `DRAFT`), even when it was approved before.
- **Return value.** Return the link as a string (or `{ asURL }`). The route answers with a `302` redirect, so storefronts can use `/rest/google-wallet/download/<tokenId>?hash=<accessKey>` as a plain link. Return `null` for tickets that should not get a Google pass; the route then answers `404`.

## Wiring

```ts title="boot.ts"
import { pluginRegistry } from '@unchainedshop/core';
import { startPlatform } from '@unchainedshop/platform';
import { createTicketingPlugin, withTicketing } from '@unchainedshop/ticketing';
import { TicketWarehousingPlugin } from '@unchainedshop/ticketing/warehousing/ticket';
import { createTicketsPdfRenderer } from './src/tickets/pdf.ts';
import { createAppleWalletPassRenderer } from './src/tickets/apple-wallet.ts';
import { createGoogleWallet } from './src/tickets/google-wallet.ts';

const ticketData = { scanBaseUrl: 'https://shop.example.com/tickets', locale: 'de' };
const timeZone = 'Europe/Zurich';

const googleWallet = process.env.GOOGLE_WALLET_CREDENTIALS
  ? createGoogleWallet({
      ...ticketData,
      issuerId: process.env.GOOGLE_WALLET_ISSUER_ID!,
      credentials: JSON.parse(process.env.GOOGLE_WALLET_CREDENTIALS),
      idPrefix: process.env.GOOGLE_WALLET_ID_PREFIX,
      issuerName: 'Example Events',
      logoUrl: 'https://shop.example.com/logo.png',
    })
  : null;

pluginRegistry.register(
  createTicketingPlugin({
    renderOrderPDF: createTicketsPdfRenderer({
      ...ticketData,
      timeZone,
      fonts: { regular: './fonts/Inter-Regular.ttf', bold: './fonts/Inter-Bold.ttf' },
      logoPath: './static/logo.png',
    }),
    createAppleWalletPass: process.env.PASS_CERTIFICATE_PATH
      ? createAppleWalletPassRenderer({
          ...ticketData,
          timeZone,
          modelPath: './wallet/ticket.pass',
          certificatePath: process.env.PASS_CERTIFICATE_PATH,
          certificatePassphrase: process.env.PASS_CERTIFICATE_SECRET,
          wwdrCertificatePath: process.env.PASS_WWDR_CERTIFICATE_PATH!,
          passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER!,
          teamIdentifier: process.env.PASS_TEAM_ID!,
          locations: [{ latitude: 47.3769, longitude: 8.5417, relevantText: 'Show your ticket at the entrance' }],
        })
      : undefined,
    createGoogleWalletPass: googleWallet?.createGoogleWalletPass,
  }),
);
pluginRegistry.register(TicketWarehousingPlugin);

const platform = await startPlatform(withTicketing({ /* your platform options */ }));
googleWallet?.subscribeToTicketEvents(platform.unchainedAPI);
```

`createTicketingPlugin()` reads the route paths when it is called, so load your environment before. Everything else about the plugin is in [Event Ticketing](./ticketing-setup).

## Offering the tickets

- **Links.** `buildWalletPassUrls(token, context)` returns the Apple and Google download links of a ticket (only for registered renderers), `buildTicketsPdfUrl(orderId, context, { variant })` and `Order.ticketsPdfUrl` the PDF link of an order.
- **E-mail attachments.** `getTicketAttachments(orderId, context, { appleWalletPasses: true })` returns the PDF link and one `.pkpass` link per ticket as `{ filename, href }` attachments. The e-mail worker downloads them from `ROOT_URL` when it sends the message, so `ROOT_URL` must be reachable from the worker (pass `rootUrl` for an internal address).
- **Storefront ticket page.** The page behind `scanBaseUrl` receives the token id and the access key. It can query the ticket with the `x-token-accesskey` header and offer the wallet buttons with the download links above.
