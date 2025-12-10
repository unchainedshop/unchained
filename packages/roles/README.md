[![npm version](https://img.shields.io/npm/v/@unchainedshop/roles.svg)](https://npmjs.com/package/@unchainedshop/roles)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/roles

Role-based access control (RBAC) system for the Unchained Engine. Provides fine-grained permission management for API operations.

Thanks to Nicolás López for the initial version of Roles: https://github.com/nicolaslopezj/roles

## Installation

```bash
npm install @unchainedshop/roles
```

## Usage

```typescript
import { Roles, Role } from '@unchainedshop/roles';

// Create a new role
const editorRole = new Role('editor');

// Allow actions for the role
editorRole.allow('updateProduct', async (product, params, context) => {
  // Return true if allowed, false otherwise
  return context.userId != null;
});

// Check if a user has permission
const allowed = await Roles.userHasPermission(
  { userId: 'user-123', user: { roles: ['editor'] } },
  'updateProduct',
  [productObject, {}]
);
```

## API Overview

### Roles Singleton

| Method | Description |
|--------|-------------|
| `Roles.registerAction` | Register a new action name |
| `Roles.registerHelper` | Register a new helper name |
| `Roles.getUserRoles` | Get user roles including special roles |
| `Roles.allow` | Check if any role allows an action |
| `Roles.userHasPermission` | Check if user has permission for action |

### Role Class

| Method | Description |
|--------|-------------|
| `new Role(name)` | Create and register a new role |
| `role.allow(action, fn)` | Add allow rule for an action |
| `role.helper(name, fn)` | Add helper function to role |

### Built-in Roles

| Role | Description |
|------|-------------|
| `Roles.adminRole` | Admin role with elevated privileges |
| `Roles.loggedInRole` | Applied to all logged-in users (`__loggedIn__`) |
| `Roles.allRole` | Applied to all users (`__all__`) |

### Special Internal Roles

| Role | Description |
|------|-------------|
| `__all__` | Automatically assigned to everyone |
| `__loggedIn__` | Automatically assigned to authenticated users |
| `__notLoggedIn__` | Automatically assigned to anonymous users |
| `__notAdmin__` | Automatically assigned to non-admin users |

### Utility Functions

| Export | Description |
|--------|-------------|
| `has` | Check if object has property |
| `isFunction` | Check if value is a function |
| `permissions` | Permission constants and helpers |

### Types

| Export | Description |
|--------|-------------|
| `RolesInterface` | Interface for the Roles singleton |
| `RoleInterface` | Interface for Role instances |
| `RoleInterfaceFactory` | Factory type for Role class |
| `IRoleOptionConfig` | Configuration options for roles |
| `CheckPermissionArgs` | Arguments tuple for permission checks |

## Configuration

```typescript
import type { IRoleOptionConfig } from '@unchainedshop/roles';

const config: IRoleOptionConfig = {
  additionalRoles: {
    customRole: (roles, actions) => {
      const role = new Role('customRole');
      role.allow(actions.READ, () => true);
    },
  },
  additionalActions: ['CUSTOM_ACTION'],
};
```

## License

EUPL-1.2
