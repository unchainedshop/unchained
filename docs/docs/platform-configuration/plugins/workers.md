---
sidebar_position: 14
title: Worker Plugins
sidebar_label: Worker Plugins
---

# Worker Plugins

:::info
Background Processing and Task Management with Worker Plugins
:::

Unchained Engine includes various worker plugins for handling background tasks, notifications, data processing, and system maintenance. These plugins run asynchronously to handle tasks that don't require immediate user interaction.

## Email Worker

Handles email notifications using Nodemailer with development-friendly features.

### Environment Variables

| NAME                                   | Default Value | Description                             |
| -------------------------------------- | ------------- | --------------------------------------- |
| `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` | `false`      | Disable email interception in non-production |

### Features

- **Development Mode**: Automatically opens emails in browser instead of sending (non-production)
- **Nodemailer Integration**: Full Nodemailer support for email transport
- **HTML/Text Support**: Handles both HTML and plain text emails
- **Attachment Support**: Full attachment support with various encoding options
- **Email Preview**: Browser-based email preview for development

### Configuration

Configure Nodemailer transport in your application:

```javascript
import nodemailer from 'nodemailer';

// Configure your email transport
const transport = nodemailer.createTransporter({
  // Your email service configuration
});
```

## Bulk Import Worker

Processes large data imports from JSON streams with event-based processing.

### Features

- **Streaming Processing**: Handles large files without memory issues
- **JSON Stream Parsing**: Parses JSON events from uploaded files
- **Event-Based**: Processes import events one by one
- **File Adapter Integration**: Works with any Unchained file storage adapter
- **Backpressure Handling**: Automatic flow control for large datasets

### Usage

```javascript
// Example bulk import event structure
{
  "events": [
    {
      "type": "CREATE_PRODUCT",
      "payload": {
        "sku": "PRODUCT-001",
        "title": "Sample Product"
      }
    }
  ]
}
```

## SMS Workers

Multiple SMS service integrations for sending SMS notifications.

### Twilio SMS Worker

Integration with Twilio for SMS messaging.

#### Environment Variables

| NAME                | Default Value | Description                             |
| ------------------- | ------------- | --------------------------------------- |
| `TWILIO_ACCOUNT_SID` |              | Your Twilio Account SID                |
| `TWILIO_AUTH_TOKEN`  |              | Your Twilio Auth Token                 |

### BudgetSMS Worker

Integration with BudgetSMS service for cost-effective SMS delivery.

### Bulkgate Worker

Integration with Bulkgate for bulk SMS messaging.

## Push Notification Worker

Handles web push notifications for browsers.

### Environment Variables

| NAME                     | Default Value | Description                             |
| ------------------------ | ------------- | --------------------------------------- |
| `VAPID_PUBLIC_KEY`       |               | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY`      |               | VAPID private key for push notifications |
| `VAPID_SUBJECT`          |               | Contact email or URL for VAPID         |

### Features

- **Web Push Protocol**: Standards-compliant web push notifications
- **VAPID Support**: Voluntary Application Server Identification
- **Multi-Browser**: Support for Chrome, Firefox, Safari, and Edge
- **Subscription Management**: Handle push subscription lifecycle

## System Workers

### Heartbeat Worker

Monitors system health and sends periodic health checks.

### Error Notifications Worker

Handles error reporting and notification distribution.

### Zombie Killer Worker

Cleans up stale processes and expired data.

### External Worker

Handles integration with external services and APIs.

### HTTP Request Worker

Processes outbound HTTP requests and webhooks.

## Cryptocurrency Workers

### Update ECB Rates Worker

Fetches currency exchange rates from the European Central Bank.

### Update Coinbase Rates Worker

Fetches cryptocurrency rates from Coinbase API.

### Export Token Worker

Handles blockchain token export operations.

### Update Token Ownership Worker

Tracks and updates blockchain token ownership information.

## Enrollment Worker

### Enrollment Order Generator

Automatically generates orders for subscription enrollments.

## Message Worker

Generic message processing and queuing system.

## Configuration

Worker plugins are typically configured at the application level:

```javascript
import { WorkerDirector } from '@unchainedshop/core';

// Workers are automatically registered when imported
import '@unchainedshop/plugins/workers/email';
import '@unchainedshop/plugins/workers/bulk-import';
// ... other workers
```

## Usage Patterns

### Email Notifications

```javascript
// Email worker is triggered automatically by the system
// Configure email templates and triggers in your application
```

### Bulk Import

```javascript
// Upload a JSON file with import events
// Worker processes events asynchronously
const importResult = await bulkImporter.process(fileId);
```

### SMS Notifications

```javascript
// SMS workers are triggered by system events
// Configure SMS templates and triggers
```

### Push Notifications

```javascript
// Register push subscriptions from frontend
// Send notifications through the worker system
```

## Development vs Production

### Development Features

- **Email Interception**: Emails open in browser instead of sending
- **Enhanced Logging**: Detailed logs for debugging
- **File System Access**: Direct file access for attachments

### Production Features

- **Real Email Sending**: Actual email delivery through configured transport
- **Performance Optimization**: Optimized for high-volume processing
- **Error Handling**: Robust error handling and retry mechanisms

## Monitoring

Monitor worker performance through:
- **Logs**: Detailed logging for each worker type
- **Health Checks**: System health monitoring
- **Error Reports**: Automatic error notification and reporting
- **Performance Metrics**: Processing times and throughput

## Integration Notes

- Workers run asynchronously in the background
- Most workers are triggered by system events
- Configuration happens through environment variables and application setup
- Workers integrate with the Unchained event system
- File-based workers require appropriate file storage adapters