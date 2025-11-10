# @unchainedshop/client

GraphQL React hooks for Unchained Commerce - a type-safe, modular client library for building e-commerce frontends.

## Overview

`@unchainedshop/client` provides ready-to-use React hooks that wrap GraphQL queries and mutations for the Unchained Commerce platform. Each hook handles data fetching, loading states, and errors, allowing you to build e-commerce applications with minimal boilerplate.

## Installation

```bash
npm install @unchainedshop/client @apollo/client graphql react
```

### Peer Dependencies

This package requires the following peer dependencies:

- `@apollo/client` ^4.0.5
- `graphql` ^16.11.0
- `react` >=18.0.0

## Setup

Configure Apollo Client with your Unchained GraphQL endpoint and wrap your application with the Unchained context provider:

```tsx
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import React from 'react';

const client = new ApolloClient({
  uri: 'http://localhost:4010/graphql',
  cache: new InMemoryCache(),
  credentials: 'include', // for authentication
});

function App() {
  return (
    <ApolloProvider client={client}>
      {/* Your app components */}
    </ApolloProvider>
  );
}
```

## Available Modules

The package is organized into domain-specific modules with subpath exports:

- **`@unchainedshop/client/accounts`** - User authentication and account management
- **`@unchainedshop/client/product`** - Product catalog and management
- **`@unchainedshop/client/order`** - Order processing and management
- **`@unchainedshop/client/assortment`** - Product collections and categories
- **`@unchainedshop/client/country`** - Country configuration
- **`@unchainedshop/client/currency`** - Currency management
- **`@unchainedshop/client/delivery-provider`** - Delivery provider configuration
- **`@unchainedshop/client/enrollment`** - Subscription enrollments
- **`@unchainedshop/client/event`** - Event management
- **`@unchainedshop/client/filter`** - Product filters
- **`@unchainedshop/client/language`** - Language configuration
- **`@unchainedshop/client/payment-providers`** - Payment provider configuration
- **`@unchainedshop/client/product-review`** - Product reviews
- **`@unchainedshop/client/quotation`** - Quotation management
- **`@unchainedshop/client/token`** - Token management (NFT, blockchain)
- **`@unchainedshop/client/warehousing-providers`** - Warehouse configuration
- **`@unchainedshop/client/work`** - Background work queue management

## Usage Examples

### Product Management

```tsx
import { useProducts, useProduct, useUpdateProduct } from '@unchainedshop/client/product';

function ProductList() {
  const { products, loading, error } = useProducts({ limit: 10, offset: 0 });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product._id}>
          <h3>{product.texts?.title}</h3>
          <p>{product.texts?.description}</p>
        </div>
      ))}
    </div>
  );
}

function ProductDetail({ productId }) {
  const { product, loading, error } = useProduct({ productId });
  const { updateProduct } = useUpdateProduct();

  const handleUpdate = async () => {
    await updateProduct({
      productId: product._id,
      product: {
        tags: ['featured'],
      },
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{product.texts?.title}</h1>
      <button onClick={handleUpdate}>Update Product</button>
    </div>
  );
}
```

### Order Management

```tsx
import { useOrders, useOrder, useConfirmOrder } from '@unchainedshop/client/order';

function OrderList() {
  const { orders, loading, error } = useOrders({ limit: 20, offset: 0 });

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {orders.map(order => (
        <li key={order._id}>
          Order #{order.orderNumber} - {order.status}
        </li>
      ))}
    </ul>
  );
}

function OrderDetail({ orderId }) {
  const { order, loading } = useOrder({ orderId });
  const { confirmOrder } = useConfirmOrder();

  const handleConfirm = async () => {
    await confirmOrder({ orderId: order._id });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Order #{order.orderNumber}</h2>
      <button onClick={handleConfirm}>Confirm Order</button>
    </div>
  );
}
```

### User Authentication

```tsx
import {
  useLoginWithPassword,
  useCurrentUser,
  logOut,
} from '@unchainedshop/client/accounts';

function Login() {
  const { loginWithPassword, loading, error } = useLoginWithPassword();

  const handleLogin = async (email: string, password: string) => {
    const result = await loginWithPassword({ username: email, password });
    if (result.data) {
      // Login successful
      console.log('Logged in:', result.data.loginWithPassword.user);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleLogin(
        formData.get('email') as string,
        formData.get('password') as string
      );
    }}>
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}

function UserProfile() {
  const { user, loading } = useCurrentUser();

  const handleLogout = async () => {
    await logOut();
    // Redirect to login page or refresh
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h2>Welcome, {user.username}</h2>
      <p>Email: {user.primaryEmail?.address}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### Assortment Management

```tsx
import {
  useAssortments,
  useCreateAssortment,
  useUpdateAssortment,
} from '@unchainedshop/client/assortment';

function AssortmentManager() {
  const { assortments, loading } = useAssortments({ limit: 50 });
  const { createAssortment } = useCreateAssortment();
  const { updateAssortment } = useUpdateAssortment();

  const handleCreate = async () => {
    await createAssortment({
      assortment: {
        isActive: true,
        isRoot: false,
        tags: ['new-collection'],
      },
      texts: [
        {
          locale: 'en',
          title: 'New Collection',
          description: 'Our latest products',
        },
      ],
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create New Assortment</button>
      <ul>
        {assortments.map(assortment => (
          <li key={assortment._id}>{assortment.texts?.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Hook Patterns

All hooks follow consistent patterns for predictable usage:

### Query Hooks (Data Fetching)

Query hooks return an object with:

- **`data`**: The fetched data (e.g., `product`, `products`, `user`)
- **`loading`**: Boolean indicating loading state
- **`error`**: Error object if the query failed
- **`refetch`**: Function to refetch the data (optional)

```tsx
const { product, loading, error } = useProduct({ productId: '123' });
```

### Mutation Hooks (Data Modification)

Mutation hooks return an object with:

- **`mutationFunction`**: Function to execute the mutation (named after the action)
- **`loading`**: Boolean indicating mutation is in progress
- **`error`**: Error object if mutation failed

```tsx
const { updateProduct, loading, error } = useUpdateProduct();

await updateProduct({
  productId: '123',
  product: { tags: ['featured'] },
});
```

### Common Hook Names

- **`use{Entity}`**: Fetch a single entity (e.g., `useProduct`, `useOrder`)
- **`use{Entities}`**: Fetch multiple entities (e.g., `useProducts`, `useOrders`)
- **`useCreate{Entity}`**: Create a new entity
- **`useUpdate{Entity}`**: Update an existing entity
- **`useRemove{Entity}`**: Delete an entity
- **`use{Action}{Entity}`**: Perform specific action (e.g., `usePublishProduct`, `useConfirmOrder`)

## TypeScript Support

All hooks are fully typed with TypeScript definitions included. The types are auto-generated from the GraphQL schema with an `I` prefix:

```tsx
import type { IProduct, IProductStatus } from '@unchainedshop/client/product';

const product: IProduct = {
  _id: '123',
  status: 'ACTIVE' as IProductStatus,
  // ... other fields
};
```

## Error Handling

Hooks provide error objects that you can use to handle failures gracefully:

```tsx
const { product, loading, error } = useProduct({ productId });

if (error) {
  if (error.networkError) {
    // Handle network errors
    console.error('Network error:', error.networkError);
  }
  if (error.graphQLErrors) {
    // Handle GraphQL errors
    error.graphQLErrors.forEach(err => {
      console.error('GraphQL error:', err.message);
    });
  }
}
```

## Advanced Configuration

### Custom Cache Policies

Configure Apollo Client cache policies for optimal performance:

```tsx
import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Product: {
      keyFields: ['_id'],
    },
    Order: {
      keyFields: ['_id'],
    },
  },
});
```

### Authentication

Include credentials in your Apollo Client configuration:

```tsx
const client = new ApolloClient({
  uri: 'http://localhost:4010/graphql',
  credentials: 'include', // Send cookies with requests
  headers: {
    // Optional: Add custom headers
    'X-Custom-Header': 'value',
  },
});
```

## Related Packages

- **[@unchainedshop/platform](../../packages/platform)** - Complete Unchained Commerce backend
- **[@unchainedshop/api](../../packages/api)** - GraphQL API server
- **[admin-ui](../)** - Reference admin dashboard implementation

## License

MIT

## Contributing

This package is part of the Unchained Commerce monorepo. See the [main README](../../README.md) for contribution guidelines.

## Support

- Documentation: https://docs.unchained.shop
- Discord: https://discord.com/invite/WGdYTqtw72
- Issues: https://github.com/unchainedshop/unchained/issues
- Community: https://github.com/unchainedshop/unchained/discussions
