---
sidebar_position: 17
title: Event System Plugins
sidebar_label: Event Systems
---

# Event System Plugins

:::info
Event-Driven Architecture with Event System Plugins
:::

Unchained Engine provides multiple event system adapters to enable event-driven communication between modules and external systems.

## Node.js Event Emitter

The default in-memory event system using Node.js built-in EventEmitter.

### Configuration

```javascript
// Automatic registration (default)
import '@unchainedshop/plugins/events/node-event-emitter';
```

### Features

- **In-Memory**: Events are handled within the same process
- **High Performance**: Fast event handling with no network overhead
- **Simple Setup**: No external dependencies required
- **Development Friendly**: Perfect for development and testing
- **Synchronous**: Events are processed synchronously within the process

### Use Cases

- **Single Instance Deployments**: Applications running on a single server
- **Development Environment**: Local development and testing
- **Simple Applications**: Applications without complex scaling requirements
- **Real-time Processing**: When low latency is critical

### Limitations

- **Single Process**: Events don't cross process boundaries
- **No Persistence**: Events are lost if the process crashes
- **Memory Usage**: All listeners are kept in memory
- **No Distribution**: Cannot scale across multiple instances

## Redis Event System

Distributed event system using Redis pub/sub for cross-process communication.

### Environment Variables

| NAME         | Default Value | Description                             |
| ------------ | ------------- | --------------------------------------- |
| `REDIS_HOST` |               | Redis server hostname (required)       |
| `REDIS_PORT` | `6379`        | Redis server port                      |
| `REDIS_DB`   | `0`           | Redis database number                  |

### Configuration

```javascript
// Automatic registration when Redis environment variables are set
import '@unchainedshop/plugins/events/redis';
```

### Features

- **Distributed**: Events work across multiple application instances
- **Persistent Connections**: Maintains Redis pub/sub connections
- **JSON Serialization**: Automatic payload serialization/deserialization
- **Scalable**: Supports horizontal scaling
- **Reliable**: Redis provides reliability and persistence options

### Use Cases

- **Multi-Instance Deployments**: Applications running on multiple servers
- **Microservices**: Communication between different services
- **Horizontal Scaling**: When you need to scale beyond a single instance
- **Production Deployments**: Robust event handling for production

### Redis Setup

```bash
# Docker Redis setup
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine

# Or using Docker Compose
version: '3'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Environment Configuration

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

## AWS EventBridge

Enterprise event system using AWS EventBridge for cloud-native event routing.

### Environment Variables

| NAME                          | Default Value | Description                             |
| ----------------------------- | ------------- | --------------------------------------- |
| `AWS_EVENTBRIDGE_BUS_NAME`    |               | EventBridge custom bus name            |
| `AWS_EVENTBRIDGE_SOURCE`      |               | Event source identifier                |
| `AWS_ACCESS_KEY_ID`           |               | AWS access key                         |
| `AWS_SECRET_ACCESS_KEY`       |               | AWS secret key                         |
| `AWS_REGION`                  |               | AWS region                             |

### Configuration

```javascript
// Automatic registration when AWS EventBridge environment variables are set
import '@unchainedshop/plugins/events/aws-eventbridge';
```

### Features

- **Cloud Native**: Fully managed AWS service
- **Event Routing**: Advanced event routing and filtering
- **Integrations**: Native integration with AWS services
- **Scalability**: Automatic scaling and reliability
- **Event Replay**: Built-in event replay capabilities
- **Schema Registry**: Event schema management

### Use Cases

- **AWS Environments**: Applications deployed on AWS
- **Enterprise Integration**: Complex event routing requirements
- **External Integrations**: Integration with AWS services and external systems
- **Event Sourcing**: When you need event replay and auditing
- **Compliance**: When you need audit trails and compliance features

### AWS Setup

1. **Create EventBridge Custom Bus**:
```bash
aws events create-event-bus --name "unchained-events"
```

2. **Create IAM Policy**:
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

3. **Environment Configuration**:
```bash
AWS_EVENTBRIDGE_BUS_NAME=unchained-events
AWS_EVENTBRIDGE_SOURCE=com.mycompany.unchained
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## Event System Usage

### Publishing Events

```javascript
import { emit } from '@unchainedshop/events';

// Publish an event
await emit('ORDER_CREATE', {
  orderId: '12345',
  userId: 'user123',
  total: 99.99
});
```

### Subscribing to Events

```javascript
import { subscribe } from '@unchainedshop/events';

// Subscribe to events
subscribe('ORDER_CREATE', async (payload) => {
  const { orderId, userId, total } = payload;
  
  // Handle the event
  await sendOrderConfirmationEmail(userId, orderId);
  await updateInventory(orderId);
});
```

### Common Events

Unchained Engine emits various system events:

- **Order Events**: `ORDER_CREATE`, `ORDER_CONFIRMED`, `ORDER_DELIVERED`
- **Payment Events**: `PAYMENT_SUCCEEDED`, `PAYMENT_FAILED`
- **User Events**: `USER_CREATED`, `USER_UPDATED`
- **Product Events**: `PRODUCT_CREATED`, `PRODUCT_UPDATED`
- **Cart Events**: `CART_UPDATED`, `CART_CHECKOUT`

## Choosing the Right Event System

### Development

Use **Node.js Event Emitter** for:
- Local development
- Testing environments
- Simple applications
- Proof of concepts

### Production - Single Instance

Use **Node.js Event Emitter** for:
- Small to medium applications
- Single server deployments
- When Redis setup is not feasible

### Production - Multi-Instance

Use **Redis Event System** for:
- Horizontal scaling requirements
- Multiple application instances
- When you need distributed events
- Cost-effective scaling

### Enterprise

Use **AWS EventBridge** for:
- AWS-based deployments
- Complex event routing needs
- Integration with AWS services
- Enterprise compliance requirements
- Event sourcing and replay needs

## Performance Considerations

### Node.js EventEmitter
- **Pros**: Fastest, no network overhead, simple
- **Cons**: Single process only, no persistence

### Redis
- **Pros**: Distributed, reliable, cost-effective
- **Cons**: Network latency, requires Redis infrastructure

### AWS EventBridge
- **Pros**: Fully managed, highly scalable, feature-rich
- **Cons**: AWS dependency, higher cost, potential latency

## Best Practices

1. **Event Naming**: Use consistent, descriptive event names
2. **Payload Design**: Keep payloads minimal but sufficient
3. **Error Handling**: Implement proper error handling in subscribers
4. **Testing**: Test event flows thoroughly
5. **Monitoring**: Monitor event processing and failures
6. **Documentation**: Document your event schema and flows

## Integration with Workers

Event systems integrate seamlessly with worker plugins:

```javascript
// Worker can subscribe to events
subscribe('ORDER_CREATE', async (payload) => {
  // Trigger email worker
  await sendEmail({
    to: payload.customerEmail,
    template: 'order-confirmation',
    data: payload
  });
});
```

This creates a powerful event-driven architecture where different parts of your system can react to events asynchronously.