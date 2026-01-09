---
sidebar_position: 10
title: Event Ticketing Setup
sidebar_label: Event Ticketing
description: Configure event ticketing with PDF tickets, Apple Wallet, and Google Wallet passes
---

# Event Ticketing Setup

This guide covers setting up the `@unchainedshop/ticketing` extension for event ticketing functionality, including PDF ticket generation and mobile wallet passes.

## Overview

The Unchained Ticketing extension provides:

- **PDF Tickets**: Generate downloadable PDF tickets for orders
- **Apple Wallet**: Create `.pkpass` files for Apple Wallet
- **Google Wallet**: Generate Google Wallet pass links
- **Magic Key Access**: Allow users to access tickets without logging in

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Order     │────▶│  Ticketing API   │────▶│  Ticket Renderers   │
│  (Tokens)   │     │  (Magic Keys)    │     │  (PDF, Wallet)      │
└─────────────┘     └──────────────────┘     └─────────────────────┘
```
By default the module provides a SVG bare bone ticket,  google wallet and apple pass templates.
In order to use google wallet and apple pass templates you need to install the required dependencies `googleapis` & `jsonwebtoken` for google wallet `@walletpass/pass-js` for apple pass beforehand.

## Installation

```bash
npm install @unchainedshop/ticketing
npm install googleapis jsonwebtoken @walletpass/pass-js
```

## Basic Setup

### 1. Configure Platform with Ticketing

```typescript
import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import baseModules from '@unchainedshop/plugins/presets/base.js';
import connectBasePluginsToFastify from '@unchainedshop/plugins/presets/base-fastify.js';
import { connect, unchainedLogger } from '@unchainedshop/api/fastify';
import setupTicketing, { ticketingModules, type TicketingAPI } from '@unchainedshop/ticketing';
import connectTicketingToFastify from '@unchainedshop/ticketing/lib/fastify.js';
import ticketingServices from '@unchainedshop/ticketing/lib/services.js';
import configureAppleWalletPass from '@unchainedshop/ticketing/lib/pdf-tickets/configureAppleWalletPass.js';
import configureGoogleWalletPass from '@unchainedshop/ticketing/lib/pdf-tickets/configureGoogleWalletPass.js';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

const platform = await startPlatform({
  modules: { ...baseModules, ...ticketingModules },
  services: { ...ticketingServices },
});

// Setup ticketing with your custom renderers
setupTicketing(platform.unchainedAPI as TicketingAPI, {
  renderOrderPDF: undefined, // use default SVG template
  createAppleWalletPass: configureAppleWalletPass({
      templateConfig: {
        description: 'Event Ticket',
        organizationName: 'Unchained Commerce',
        passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || 'pass.com.example.ticket',
        teamIdentifier: process.env.PASS_TEAM_ID,
        backgroundColor: 'rgb(255,255,255)',
        foregroundColor: 'rgb(50,50,50)',
      },
      // Optional: customize field labels for localization
      labels: {
        eventLabel: 'Event',
        locationLabel: 'Venue',
        ticketNumberLabel: 'Ticket #',
        infoLabel: 'Details',
        slotChangeMessage: 'Event time changed: %@',
        barcodeHint: 'Scan for entry',
      },
    }),
  createGoogleWalletPass: configureGoogleWalletPass({
      issuerName: 'Unchained Commerce',
      countryCode: 'CH',
      hexBackgroundColor: '#FFFFFF',
      homepageUri: {
        uri: 'https://unchained.shop',
        description: 'Event Website',
      },
    }),
});

// Connect Unchained to Fastify
connect(fastify, platform, {
  allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
  initPluginMiddlewares: (app) => {
    connectBasePluginsToFastify(app);
    connectTicketingToFastify(app);
  }
});

await fastify.listen({ host: '::', port: 3000 });
```

### 2. Express Alternative

```typescript
import express from 'express';
import setupTicketing, { ticketingModules } from '@unchainedshop/ticketing';
import connectTicketingToExpress from '@unchainedshop/ticketing/lib/express.js';
import ticketingServices from '@unchainedshop/ticketing/lib/services.js';
import configureAppleWalletPass from '@unchainedshop/ticketing/lib/pdf-tickets/configureAppleWalletPass.js';
import configureGoogleWalletPass from '@unchainedshop/ticketing/lib/pdf-tickets/configureGoogleWalletPass.js';

const app = express();

const platform = await startPlatform({
  modules: { ...baseModules, ...ticketingModules },
  services: { ...ticketingServices },
});

setupTicketing(platform.unchainedAPI, {
  renderOrderPDF: undefined, // use default SVG template
  createAppleWalletPass: configureAppleWalletPass({
      templateConfig: {
        description: 'Event Ticket',
        organizationName: 'Unchained Commerce',
        passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || 'pass.com.example.ticket',
        teamIdentifier: process.env.PASS_TEAM_ID,
        backgroundColor: 'rgb(255,255,255)',
        foregroundColor: 'rgb(50,50,50)',
      },
      // Optional: customize field labels for localization
      labels: {
        eventLabel: 'Event',
        locationLabel: 'Venue',
        ticketNumberLabel: 'Ticket #',
        infoLabel: 'Details',
        slotChangeMessage: 'Event time changed: %@',
        barcodeHint: 'Scan for entry',
      },
    }),
  createGoogleWalletPass: configureGoogleWalletPass({
      issuerName: 'Unchained Commerce',
      countryCode: 'CH',
      hexBackgroundColor: '#FFFFFF',
      homepageUri: {
        uri: 'https://unchained.shop',
        description: 'Event Website',
      },
    }),
});

connectTicketingToExpress(app);
```

## PDF Ticket Rendering

Create a PDF renderer using `@react-pdf/renderer`:

```bash
npm install @react-pdf/renderer
```

```tsx
import React from 'react';
import ReactPDF, { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  ticketContainer: {
    border: '1px solid #ccc',
    padding: 20,
    marginBottom: 20,
  },
  qrCode: {
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
  details: {
    marginTop: 20,
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 14,
    marginBottom: 10,
  },
});

interface TicketData {
  tokenId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  seat?: string;
  qrCodeUrl: string;
}

const TicketDocument = ({ tickets, orderNumber }: { tickets: TicketData[]; orderNumber: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Your Tickets</Text>
      <Text>Order: {orderNumber}</Text>

      {tickets.map((ticket, index) => (
        <View key={ticket.tokenId} style={styles.ticketContainer}>
          <Text style={styles.value}>{ticket.eventName}</Text>

          <Image src={ticket.qrCodeUrl} style={styles.qrCode} />

          <View style={styles.details}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{ticket.eventDate}</Text>

            <Text style={styles.label}>Venue</Text>
            <Text style={styles.value}>{ticket.venue}</Text>

            {ticket.seat && (
              <>
                <Text style={styles.label}>Seat</Text>
                <Text style={styles.value}>{ticket.seat}</Text>
              </>
            )}

            <Text style={styles.label}>Ticket ID</Text>
            <Text style={styles.value}>{ticket.tokenId}</Text>
          </View>
        </View>
      ))}
    </Page>
  </Document>
);

// Export the renderer function
export default async function renderOrderPDF(
  { orderId, variant }: { orderId: string; variant?: string },
  unchainedAPI: TicketingAPI
) {
  const { modules } = unchainedAPI;

  const order = await modules.orders.findOrder({ orderId });
  const tokens = await modules.warehousing.findTokens({ orderId });

  // Generate QR codes and prepare ticket data
  const tickets = await Promise.all(
    tokens.map(async (token) => {
      const qrCodeUrl = await QRCode.toDataURL(token._id, { width: 300 });

      return {
        tokenId: token._id,
        eventName: token.meta?.eventName || 'Event',
        eventDate: token.meta?.eventDate || '',
        venue: token.meta?.venue || '',
        seat: token.meta?.seat,
        qrCodeUrl,
      };
    })
  );

  return ReactPDF.renderToStream(
    <TicketDocument tickets={tickets} orderNumber={order.orderNumber} />
  );
}
```

## Apple Wallet Pass

### Prerequisites

1. **Apple Developer Account** with Pass Type ID capability
2. **Pass Type ID** registered at [developer.apple.com](https://developer.apple.com/account)
3. **Production Certificate** for your Pass Type ID

### Certificate Setup

1. Create a Pass Type ID in your Apple Developer account
2. Generate and download a production certificate
3. Import into Keychain Access
4. Export as `.p12` file (include both certificate and private key)
5. Convert to PEM format:

```bash
openssl pkcs12 -in Certificates.p12 -legacy -clcerts -out cert_and_key.pem
```

### Environment Variables

```bash
PASS_CERTIFICATE_PATH=./cert_and_key.pem
PASS_CERTIFICATE_SECRET=YOUR_PEM_PASSPHRASE
PASS_TEAM_ID=YOUR_TEAM_ID
```

### Apple Wallet Renderer

```bash
npm install @walletpass/pass-js
```

```typescript
import { Template, constants } from '@walletpass/pass-js';
import path from 'path';

export default async function createAppleWalletPass(
  token: { _id: string; meta: any },
  unchainedAPI: TicketingAPI
) {
  const template = new Template('eventTicket', {
    passTypeIdentifier: 'pass.com.yourcompany.tickets',
    teamIdentifier: process.env.PASS_TEAM_ID,
    organizationName: 'Your Company',
    description: 'Event Ticket',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(60, 65, 76)',
    labelColor: 'rgb(255, 255, 255)',
  });

  // Load certificate
  await template.loadCertificate(
    process.env.PASS_CERTIFICATE_PATH,
    process.env.PASS_CERTIFICATE_SECRET
  );

  // Add images (icon, logo, strip, etc.)
  await template.images.add('icon', './assets/icon.png');
  await template.images.add('logo', './assets/logo.png');

  const pass = await template.createPass({
    serialNumber: token._id,
    relevantDate: token.meta?.eventDate,
    locations: token.meta?.venue ? [{
      latitude: token.meta.latitude,
      longitude: token.meta.longitude,
      relevantText: token.meta.venue,
    }] : undefined,
  });

  // Add ticket fields
  pass.primaryFields.add({
    key: 'event',
    label: 'EVENT',
    value: token.meta?.eventName || 'Event',
  });

  pass.secondaryFields.add({
    key: 'date',
    label: 'DATE',
    value: token.meta?.eventDate || '',
  });

  pass.auxiliaryFields.add({
    key: 'venue',
    label: 'VENUE',
    value: token.meta?.venue || '',
  });

  if (token.meta?.seat) {
    pass.auxiliaryFields.add({
      key: 'seat',
      label: 'SEAT',
      value: token.meta.seat,
    });
  }

  // Add barcode
  pass.barcodes = [{
    format: constants.barcodeFormat.QR,
    message: token._id,
    messageEncoding: 'iso-8859-1',
  }];

  return pass;
}
```

## Google Wallet Pass

### Prerequisites

1. **Google Cloud Project** with Wallet API enabled
2. **Service Account** with Wallet Object Creator role
3. **Issuer ID** from Google Pay & Wallet Console

### Environment Variables

```bash
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GOOGLE_WALLET_ISSUER_ID=YOUR_ISSUER_ID
```

### Google Wallet Renderer

```typescript
import { GoogleAuth } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
const baseUrl = 'https://walletobjects.googleapis.com/walletobjects/v1';

export default async function createGoogleWalletPass(
  token: { _id: string; meta: any },
  unchainedAPI: TicketingAPI
) {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });

  const client = await auth.getClient();
  const classId = `${issuerId}.event_${token.meta?.eventId || 'default'}`;
  const objectId = `${issuerId}.ticket_${token._id}`;

  // Create or update event class
  const eventClass = {
    id: classId,
    issuerName: 'Your Company',
    eventName: {
      defaultValue: {
        language: 'en',
        value: token.meta?.eventName || 'Event',
      },
    },
    venue: {
      name: {
        defaultValue: {
          language: 'en',
          value: token.meta?.venue || '',
        },
      },
    },
    dateTime: {
      start: token.meta?.eventDate,
    },
    reviewStatus: 'UNDER_REVIEW',
  };

  try {
    await client.request({
      url: `${baseUrl}/eventTicketClass/${classId}`,
      method: 'GET',
    });
  } catch (err) {
    // Class doesn't exist, create it
    await client.request({
      url: `${baseUrl}/eventTicketClass`,
      method: 'POST',
      data: eventClass,
    });
  }

  // Create ticket object
  const ticketObject = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    ticketHolderName: token.meta?.holderName || '',
    ticketNumber: token._id,
    seatInfo: token.meta?.seat ? {
      seat: {
        defaultValue: {
          language: 'en',
          value: token.meta.seat,
        },
      },
    } : undefined,
    barcode: {
      type: 'QR_CODE',
      value: token._id,
    },
  };

  // Create JWT for "Add to Google Wallet" URL
  const credentials = await auth.getCredentials();
  const payload = {
    iss: credentials.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: ['https://yoursite.com'],
    payload: {
      eventTicketObjects: [ticketObject],
    },
  };

  const privateKey = credentials.private_key;
  const token_jwt = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

  const saveUrl = `https://pay.google.com/gp/v/save/${token_jwt}`;

  return {
    asURL: async () => saveUrl,
  };
}
```

## Magic Key Order Access

Magic keys allow users to access their orders and tickets without logging in - perfect for email links.

### Generate Magic Key

```typescript
// In your order confirmation handler
const magicKey = await modules.passes.buildMagicKey(orderId);

// Include in confirmation email
const ticketUrl = `https://my-shop.com/orders/${orderId}?otp=${magicKey}`;
```

### Use Magic Key in API Requests

```http
GET /graphql
x-magic-key: YOUR_MAGIC_KEY
```

### Protected Actions

Magic keys provide access to:
- `viewOrder` - View order details
- `updateToken` - Update token information
- `viewToken` - View individual tickets

### Environment Configuration

```bash
# Required for magic key encryption
UNCHAINED_SECRET=your-secret-key-at-least-32-characters
```

## API Endpoints

The ticketing extension adds these REST endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders/:orderId/tickets.pdf` | GET | Download PDF tickets |
| `/tokens/:tokenId.pkpass` | GET | Download Apple Wallet pass |
| `/tokens/:tokenId/google-wallet` | GET | Redirect to Google Wallet |

## GraphQL Integration

Query tickets through order items:

```graphql
query OrderTickets($orderId: ID!) {
  order(orderId: $orderId) {
    _id
    orderNumber
    items {
      _id
      tokens {
        _id
        quantity
      }
    }
  }
}
```

## Frontend Implementation

### Ticket Download Component

```tsx
function TicketDownload({ orderId, magicKey }: { orderId: string; magicKey?: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const pdfUrl = magicKey
    ? `${baseUrl}/orders/${orderId}/tickets.pdf?otp=${magicKey}`
    : `${baseUrl}/orders/${orderId}/tickets.pdf`;

  return (
    <div className="ticket-actions">
      <a href={pdfUrl} download className="btn btn-primary">
        Download PDF Tickets
      </a>
    </div>
  );
}
```

### Wallet Pass Buttons

```tsx
function WalletButtons({ tokenId, magicKey }: { tokenId: string; magicKey?: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const queryParams = magicKey ? `?otp=${magicKey}` : '';

  return (
    <div className="wallet-buttons">
      <a
        href={`${baseUrl}/tokens/${tokenId}.pkpass${queryParams}`}
        className="btn btn-apple-wallet"
      >
        <img src="/apple-wallet-badge.svg" alt="Add to Apple Wallet" />
      </a>

      <a
        href={`${baseUrl}/tokens/${tokenId}/google-wallet${queryParams}`}
        className="btn btn-google-wallet"
      >
        <img src="/google-wallet-badge.svg" alt="Add to Google Wallet" />
      </a>
    </div>
  );
}
```

## Testing

The ticketing example includes test files:

```bash
# Clone the repository
git clone https://github.com/unchainedshop/unchained.git

# Navigate to ticketing example
cd unchained/examples/ticketing

# Install dependencies
npm install

# Run the example
npm start
```

## Best Practices

### 1. Unique Serial Numbers

Always use unique token IDs for pass serial numbers to enable updates:

```typescript
pass.serialNumber = token._id;
```

### 2. Relevant Dates

Include event dates for lock-screen notifications:

```typescript
pass.relevantDate = new Date(token.meta.eventDate);
```

### 3. Location-Based Notifications

Add venue coordinates for location-based pass display:

```typescript
pass.locations = [{
  latitude: venue.lat,
  longitude: venue.lng,
  relevantText: 'Your event is nearby!',
}];
```

### 4. Pass Updates

Implement push notifications for pass updates using Apple's push service.

## Resources

- **Ticketing Package**: [github.com/unchainedshop/unchained/tree/master/packages/ticketing](https://github.com/unchainedshop/unchained/tree/master/packages/ticketing)
- **Example Implementation**: [github.com/unchainedshop/unchained/tree/master/examples/ticketing](https://github.com/unchainedshop/unchained/tree/master/examples/ticketing)
- **Apple Wallet Documentation**: [developer.apple.com/wallet](https://developer.apple.com/wallet/)
- **Google Wallet API**: [developers.google.com/wallet](https://developers.google.com/wallet)

## Related

- [Warehousing Module](../platform-configuration/modules/warehousing) - Token management
- [Order Lifecycle](../concepts/order-lifecycle) - Order processing
- [Worker](../extend/worker) - Background job processing
