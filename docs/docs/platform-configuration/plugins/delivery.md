---
sidebar_position: 15
title: Delivery Plugins
sidebar_label: Delivery Plugins
---

# Delivery Plugins

:::info
Shipping and Delivery Options with Delivery Plugins
:::

Unchained Engine provides several delivery plugins to handle different shipping and pickup scenarios for your e-commerce orders.

## Post Delivery Plugin

A simple manual shipping plugin for traditional postal and courier deliveries.

### Configuration

```graphql
createDeliveryProvider(
  deliveryProvider: {
    type: SHIPPING
    adapterKey: "shop.unchained.post"
    configuration: []
  }
) {
  _id
}
```

### Features

- **Manual Processing**: Simple delivery method without automated integrations
- **Shipping Support**: Supports standard shipping delivery type
- **Always Active**: No configuration requirements, always available
- **Generic Implementation**: Suitable for any postal or courier service

### Use Cases

- **Local Post Office**: Standard postal deliveries
- **Courier Services**: Manual courier dispatch
- **Custom Shipping**: Integration with your existing shipping process
- **Simple Setup**: Quick delivery option without complex configuration

## Store Pickup Plugin

Enables customers to pick up orders from predefined store locations.

### Configuration

```graphql
createDeliveryProvider(
  deliveryProvider: {
    type: PICKUP
    adapterKey: "shop.unchained.stores"
    configuration: [
      {
        key: "stores"
        value: "[{\"_id\":\"store1\",\"name\":\"Main Store\",\"address\":\"123 Main St\"}]"
      }
    ]
  }
) {
  _id
}
```

### Store Configuration Format

```json
[
  {
    "_id": "store1",
    "name": "Main Store",
    "address": "123 Main Street, City",
    "phone": "+1-555-0123",
    "hours": "Mon-Fri 9AM-6PM",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  },
  {
    "_id": "store2", 
    "name": "Branch Store",
    "address": "456 Oak Avenue, City",
    "phone": "+1-555-0456",
    "hours": "Mon-Sat 10AM-8PM"
  }
]
```

### Features

- **Multiple Locations**: Support for multiple pickup locations
- **Location Search**: Find pickup locations by ID
- **No Auto-Release**: Orders require manual processing at pickup
- **Flexible Configuration**: JSON-based store configuration
- **Store Details**: Support for addresses, hours, contact information

### API Usage

#### Get All Pickup Locations

```graphql
query {
  deliveryProvider(deliveryProviderId: "store-pickup-provider-id") {
    pickUpLocations {
      _id
      name
      address
      phone
      hours
    }
  }
}
```

#### Get Specific Pickup Location

```graphql
query {
  deliveryProvider(deliveryProviderId: "store-pickup-provider-id") {
    pickUpLocation(pickUpLocationId: "store1") {
      _id
      name
      address
      phone
      hours
    }
  }
}
```

## Send Message Plugin

Message-based delivery notifications and communications.

### Configuration

```graphql
createDeliveryProvider(
  deliveryProvider: {
    type: SHIPPING
    adapterKey: "shop.unchained.send-message"
    configuration: []  
  }
) {
  _id
}
```

### Features

- **Notification System**: Automated delivery notifications
- **Message Templates**: Customizable message templates
- **Multi-Channel**: Support for various communication channels
- **Event-Driven**: Triggered by delivery status changes

## Usage Patterns

### Standard Shipping Flow

1. **Create Delivery Provider**: Configure postal delivery
2. **Calculate Shipping**: Use pricing plugins for shipping costs
3. **Process Order**: Handle shipping through your fulfillment system
4. **Update Status**: Manually update delivery status

### Store Pickup Flow

1. **Configure Stores**: Set up store locations and details
2. **Location Selection**: Customer selects preferred pickup location
3. **Order Processing**: Process order for specific store
4. **Pickup Notification**: Notify customer when order is ready
5. **Manual Fulfillment**: Staff handles pickup at store

### Integration with Pricing

Delivery plugins work with pricing plugins to calculate shipping costs:

```javascript
// Pricing plugins can access delivery provider configuration
// to calculate shipping costs based on delivery method
```

## Development Notes

### Custom Delivery Plugins

Create custom delivery plugins by implementing the `IDeliveryAdapter` interface:

```javascript
import { IDeliveryAdapter, DeliveryAdapter, DeliveryDirector } from '@unchainedshop/core';

const CustomDelivery = {
  ...DeliveryAdapter,
  
  key: 'shop.custom.delivery',
  label: 'Custom Delivery Method',
  version: '1.0.0',
  
  typeSupported: (type) => {
    return type === 'SHIPPING'; // or 'PICKUP'
  },
  
  actions: (config, context) => {
    return {
      ...DeliveryAdapter.actions(config, context),
      
      isActive: () => true,
      configurationError: () => null,
      
      // Additional methods for pickup providers
      pickUpLocations: async () => [...],
      pickUpLocationById: async (id) => {...}
    };
  }
};

DeliveryDirector.registerAdapter(CustomDelivery);
```

### Provider Types

- **SHIPPING**: For delivery to customer addresses
- **PICKUP**: For customer pickup at designated locations

### Integration Points

- **Pricing Plugins**: Calculate delivery costs
- **Worker Plugins**: Handle delivery notifications
- **Order Management**: Track delivery status and updates
- **Customer Communication**: Notify about delivery status

## Best Practices

1. **Store Configuration**: Keep store information up to date
2. **Delivery Tracking**: Implement proper status tracking
3. **Customer Communication**: Provide clear delivery information
4. **Error Handling**: Handle delivery failures gracefully
5. **Testing**: Test delivery flows thoroughly
6. **Documentation**: Document custom delivery processes