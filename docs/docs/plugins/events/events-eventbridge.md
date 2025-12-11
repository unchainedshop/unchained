---
sidebar_position: 20
title: AWS EventBridge
sidebar_label: AWS EventBridge
description: Enterprise event system using AWS EventBridge
---

# AWS EventBridge

Enterprise event system using AWS EventBridge for cloud-native event routing.

## Installation

```typescript
import '@unchainedshop/plugins/events/aws-eventbridge';
```

Requires the AWS SDK as a peer dependency:

```bash
npm install @aws-sdk/client-eventbridge
```

:::warning Explicit Configuration Required
Unlike the Node.js event emitter (which is the default), this plugin requires explicit configuration. You must call `setEmitAdapter()` to activate EventBridge as your event system:

```typescript
import { setEmitAdapter } from '@unchainedshop/events';
import { EventBridgeEventEmitter } from '@unchainedshop/plugins/events/aws-eventbridge';

const adapter = await EventBridgeEventEmitter({
  region: 'us-east-1',
  source: 'com.mycompany.unchained',
  busName: 'unchained-events',
});
setEmitAdapter(adapter);
```
:::

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EVENT_BRIDGE_REGION` | - | AWS region (required) |
| `EVENT_BRIDGE_SOURCE` | - | Event source identifier (required) |
| `EVENT_BRIDGE_BUS_NAME` | - | EventBridge custom bus name (required) |
| `AWS_ACCESS_KEY_ID` | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | - | AWS secret key |

## Features

- **Cloud Native**: Fully managed AWS service
- **Event Routing**: Advanced event routing and filtering
- **Integrations**: Native integration with AWS services
- **Scalability**: Automatic scaling and reliability
- **Event Replay**: Built-in event replay capabilities
- **Schema Registry**: Event schema management

## Use Cases

- **AWS Environments**: Applications deployed on AWS
- **Enterprise Integration**: Complex event routing requirements
- **External Integrations**: Integration with AWS services and external systems
- **Event Sourcing**: When you need event replay and auditing
- **Compliance**: When you need audit trails and compliance features

## AWS Setup

### 1. Create EventBridge Custom Bus

```bash
aws events create-event-bus --name "unchained-events"
```

### 2. Create IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents",
        "events:List*",
        "events:Describe*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Configure Environment

```bash
EVENT_BRIDGE_REGION=us-east-1
EVENT_BRIDGE_SOURCE=com.mycompany.unchained
EVENT_BRIDGE_BUS_NAME=unchained-events
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

## Usage

### Publishing Events

```typescript
import { emit } from '@unchainedshop/events';

// Events are sent to EventBridge
await emit('ORDER_CREATE', {
  orderId: '12345',
  userId: 'user123',
  total: 99.99
});
```

### Subscribing to Events

EventBridge does not support direct subscription from the application. Use EventBridge rules to route events to:

- Lambda functions
- SQS queues
- SNS topics
- API Gateway endpoints
- Other AWS services

## Performance

- **Pros**: Fully managed, highly scalable, feature-rich
- **Cons**: AWS dependency, higher cost, potential latency

## When to Use

Use AWS EventBridge for:

- AWS-based deployments
- Complex event routing needs
- Integration with AWS services
- Enterprise compliance requirements
- Event sourcing and replay needs

## Adapter Details

| Property | Value |
|----------|-------|
| Source | [events/aws-eventbridge.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/events/aws-eventbridge.ts) |

## Related

- [Node.js Events](./events-node.md) - In-memory events
- [Redis Events](./events-redis.md) - Distributed events with Redis
- [Plugins Overview](./) - All available plugins
