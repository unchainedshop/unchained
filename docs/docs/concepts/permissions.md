---
sidebar_position: 8
title: Permissions Reference
sidebar_label: Permissions
description: Complete reference for RBAC permissions, roles, and access control in Unchained Engine
---

# Permissions Reference

Unchained Engine uses a declarative, role-based access control (RBAC) system with 111 permission actions and context-aware evaluation.

## Built-in Roles

| Role | Scope | Description |
|------|-------|-------------|
| `admin` | All actions | Full access to everything |
| `__loggedIn__` | Own data | Authenticated users can manage their own data |
| `__all__` | Public data | Public read access to products, assortments, and localization |
| `__notLoggedIn__` | Auth only | Anonymous users can register and login |
| `__notAdmin__` | Auto-added | Added to all non-admin authenticated users |

Roles `__all__`, `__loggedIn__`, `__notLoggedIn__`, and `__notAdmin__` are **special roles** automatically assigned during permission evaluation. You don't assign them to users manually.

## Permission Actions

### View Permissions

| Action | Description |
|--------|-------------|
| `viewProduct`, `viewProducts` | View products (public: active only) |
| `viewOrder`, `viewOrders` | View orders (loggedIn: own only) |
| `viewUser`, `viewUsers`, `viewUserCount` | View user data |
| `viewUserRoles`, `viewUserPublicInfos`, `viewUserPrivateInfos` | View user details |
| `viewUserOrders`, `viewUserQuotations`, `viewUserEnrollments`, `viewUserTokens` | View user relations |
| `viewUserProductReviews` | View user's reviews |
| `viewAssortment`, `viewAssortments` | View assortments (public: active only) |
| `viewFilter`, `viewFilters` | View filters (public: active only) |
| `viewLanguage`, `viewLanguages` | View languages (public: active only) |
| `viewCountry`, `viewCountries` | View countries (public: active only) |
| `viewCurrency`, `viewCurrencies` | View currencies (public: active only) |
| `viewPaymentProvider`, `viewPaymentProviders`, `viewPaymentInterfaces` | View payment config |
| `viewDeliveryProvider`, `viewDeliveryProviders`, `viewDeliveryInterfaces` | View delivery config |
| `viewWarehousingProvider`, `viewWarehousingProviders`, `viewWarehousingInterfaces` | View warehousing config |
| `viewQuotation`, `viewQuotations` | View quotations |
| `viewEnrollment`, `viewEnrollments` | View enrollments |
| `viewToken`, `viewTokens` | View tokens |
| `viewTranslations` | View text translations |
| `viewShopInfo` | View shop configuration (public) |
| `viewWork`, `viewWorkQueue` | View work queue |
| `viewEvent`, `viewEvents` | View events |
| `viewStatistics` | View analytics |
| `viewLogs` | View system logs |

### Management Permissions

| Action | Description |
|--------|-------------|
| `manageUsers` | Full user management |
| `manageProducts` | Create, update, delete products |
| `manageAssortments` | Manage categories and collections |
| `manageFilters` | Manage product filters |
| `manageLanguages` | Manage languages |
| `manageCountries` | Manage countries |
| `manageCurrencies` | Manage currencies |
| `managePaymentProviders` | Manage payment providers |
| `manageDeliveryProviders` | Manage delivery providers |
| `manageWarehousingProviders` | Manage warehousing providers |
| `manageBookmarks` | Manage user bookmarks |
| `manageProductReviews` | Moderate product reviews |
| `manageQuotations` | Manage quotations |
| `manageWorker` | Manage background jobs |
| `managePaymentCredentials` | Manage saved payment methods |

### Update Permissions

| Action | Description |
|--------|-------------|
| `updateUser` | Update user profile |
| `updateUsername` | Change username |
| `updateCart` | Modify cart contents |
| `updateOrder` | Modify order details |
| `updateOrderDelivery` | Update order delivery |
| `updateOrderPayment` | Update order payment |
| `updateOrderDiscount` | Manage order discounts |
| `updateOrderItem` | Modify order items |
| `updateProductReview` | Edit product reviews |
| `updateEnrollment` | Modify enrollments |
| `updateToken` | Modify tokens |

### Order Lifecycle

| Action | Description |
|--------|-------------|
| `createCart` | Create a shopping cart |
| `checkoutCart` | Process checkout |
| `markOrderConfirmed` | Confirm a pending order |
| `markOrderRejected` | Reject a pending order |
| `markOrderPaid` | Mark order as paid |
| `markOrderDelivered` | Mark order as delivered |

### Authentication

| Action | Description |
|--------|-------------|
| `loginAsGuest` | Create anonymous session |
| `loginWithPassword` | Password authentication |
| `loginWithWebAuthn` | Passkey authentication |
| `logout` | End session |
| `logoutAllSessions` | Invalidate all tokens |
| `verifyEmail` | Verify email address |
| `useWebAuthn` | WebAuthn operations |
| `changePassword` | Change own password |
| `resetPassword` | Reset with token |
| `forgotPassword` | Request reset email |
| `impersonate` | Impersonate a user |
| `stopImpersonation` | End impersonation |
| `createUser` | Register new user |
| `enrollUser` | Enroll new user |

### User Actions

| Action | Description |
|--------|-------------|
| `reviewProduct` | Submit product review |
| `voteProductReview` | Vote on reviews |
| `requestQuotation` | Submit RFP |
| `answerQuotation` | Respond to quotation |
| `bookmarkProduct` | Bookmark/favorite products |
| `registerPaymentCredentials` | Save payment methods |
| `sendEmail` | Send messages |
| `removeUser` | Delete user account |

### Files & Media

| Action | Description |
|--------|-------------|
| `downloadFile` | Download files |
| `uploadUserAvatar` | Upload avatar |
| `uploadTempFile` | Upload temporary files |
| `confirmMediaUpload` | Confirm media upload |

### Other

| Action | Description |
|--------|-------------|
| `search` | Search products/assortments |
| `pageView` | Log page views |
| `heartbeat` | Update activity |
| `bulkImport` | Bulk import data |

## Checking Permissions

### In GraphQL Resolvers

Use the `checkResolver` decorator:

```typescript
import { acl } from '@unchainedshop/api';

export default acl.checkResolver('viewUser')(
  async (root, { userId }, context) => {
    return context.modules.users.findUserById(userId);
  }
);
```

### Field-Level Permissions

Use `checkTypeResolver` for field-level access control:

```typescript
import { acl } from '@unchainedshop/api';

export const OrderType = {
  deliveries: acl.checkTypeResolver('viewOrder', 'deliveries'),
  payments: acl.checkTypeResolver('viewOrder', 'payments'),
};
```

### Direct Permission Check

```typescript
import { Roles } from '@unchainedshop/roles';

const allowed = await Roles.userHasPermission(
  context,
  'manageUsers',
  [user, { userId }],
);

if (!allowed) {
  throw new Error('Permission denied');
}
```

## Custom Roles

### Define a Custom Role

```typescript
import { roles } from '@unchainedshop/api';

roles.configureRoles({
  additionalRoles: {
    support: (role, actions) => {
      // View all orders
      role.allow(actions.viewOrder, () => true);
      role.allow(actions.viewOrders, () => true);

      // Only confirm/reject pending orders
      role.allow(actions.markOrderConfirmed, () => true);
      role.allow(actions.markOrderRejected, () => true);

      // View users but not modify
      role.allow(actions.viewUser, () => true);
      role.allow(actions.viewUsers, () => true);
    },

    moderator: (role, actions) => {
      role.allow(actions.manageProductReviews, () => true);
      role.allow(actions.updateProductReview, () => true);
    },
  },

  // Register custom actions
  additionalActions: ['moderateContent', 'viewAnalytics'],
});
```

### Assign Roles

```typescript
// Via module API
await modules.users.updateRoles(userId, ['support']);

// Via GraphQL
await graphqlFetch({
  query: `
    mutation {
      setRoles(userId: "user-123", roles: ["support"])
    }
  `,
});
```

### Context-Aware Rules

Rules can inspect the user, target object, and parameters:

```typescript
roles.configureRoles({
  additionalRoles: {
    regionManager: (role, actions) => {
      // Only view orders from their region
      role.allow(actions.viewOrder, async (order, params, context) => {
        const user = await context.modules.users.findUserById(context.userId);
        return order.countryCode === user.profile?.address?.countryCode;
      });
    },
  },
});
```

## Permission Evaluation

Rules are evaluated with **OR logic**: if any allow rule for an action returns `true`, access is granted.

```
User roles → [admin, __loggedIn__, __all__]
                ↓
For each role, check allow rules for the action
                ↓
Any rule returns true → ACCESS GRANTED
All rules return false → ACCESS DENIED
```

## Related

- [Authentication](./authentication.md) - Authentication patterns
- [Custom Modules](../extend/custom-modules.md) - Secure custom modules
