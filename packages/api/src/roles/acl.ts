import type { GraphQLResolveInfo } from 'graphql';
import type { CheckPermissionArgs } from '@unchainedshop/roles';
import { emit } from '@unchainedshop/events';
import { NoPermissionError, PermissionSystemError } from '../errors.ts';
import { API_EVENTS } from '../events.ts';

const SENSITIVE_ACTION_PREFIXES = [
  'manageUser',
  'login',
  'logout',
  'reset',
  'forgot',
  'impersonate',
  'updateUser',
  'removeUser',
  'createUser',
  // Bulk user mutations wrap the same privileged operations as their single-op
  // counterparts (manageUsers/updateUser), so they must emit ACL_GRANTED_SENSITIVE
  // too — otherwise mass role assignment and mass deletion leave no audit trail.
  'bulkSetUserRoles',
  'bulkRemoveUsers',
  'bulkUpdateUserTags',
];

const defaultOptions = {
  showKey: true,
  mapArgs: (...args) => args,
};

const emptyArray: CheckPermissionArgs = [];

export const ensureActionExists = (action, userOptions) => {
  if (!action) {
    throw new PermissionSystemError({ userOptions });
  }
};

export const ensureIsFunction = (fn, action, options, key) => {
  if (typeof fn !== 'function') {
    throw new PermissionSystemError({
      action,
      key: options.showKey ? key : '',
    });
  }
};

const isSensitiveAction = (action: string): boolean => {
  return SENSITIVE_ACTION_PREFIXES.some((prefix) => action.startsWith(prefix));
};

const checkAction = async (context, action, args = emptyArray, info?: GraphQLResolveInfo) => {
  const key = info?.parentType ? `${info.parentType.name}.${info.fieldName}` : undefined;

  const hasPermission = await context.roles.userHasPermission(context, action, args);
  if (hasPermission) {
    if (isSensitiveAction(action)) {
      await emit(API_EVENTS.ACL_GRANTED_SENSITIVE, {
        userId: context.userId,
        action,
        key,
      });
    }
    return;
  }

  await emit(API_EVENTS.ACL_DENIED, {
    userId: context.userId,
    action,
    key,
  });

  const keyText = key ? ` in "${key}"` : '';

  throw new NoPermissionError({
    userId: context.userId,
    action,
    key,
    message: `The user "${
      context.userId || 'anonymous'
    }" has no permission to perform the action "${action}"${keyText}`,
  });
};

const wrapFunction = (fn, name, action, userOptions?: any) => {
  const options = { ...defaultOptions, ...userOptions };
  ensureIsFunction(fn, action, options, name || fn.name);
  return async (root, params, context, info?: GraphQLResolveInfo, ...other) => {
    const args = options.mapArgs(root, params, info, ...other);
    await checkAction(context, action, args, options.showKey ? info : undefined);
    return fn(root, params, context, info, ...other);
  };
};

const checkResolver = (action, userOptions?: any) => {
  ensureActionExists(action, userOptions);
  return (fn: any, name?: string) => wrapFunction(fn, name, action, userOptions);
};

const checkTypeResolver = (action, key) =>
  async function _checkTypeResolver(obj, params, context, info?: GraphQLResolveInfo) {
    await checkAction(context, action, [obj, params], info);
    if (typeof obj[key] === 'function') {
      return obj[key](params, context);
    }
    return obj[key];
  };

const resolverDecorator = function resolverDecorator(action, userOptions?: any) {
  ensureActionExists(action, userOptions);
  return function decorator(target, key, descriptor) {
    const fn = descriptor.value || target[key];
    return {
      configurable: true,
      get() {
        const value = wrapFunction(fn, key, action, userOptions);
        Object.defineProperty(this, key, {
          value,
          configurable: true,
          writable: true,
        });
        return value;
      },
    };
  };
};

// @resolverDecorator(action)
// resolverToBeChecked: () => ...
export default resolverDecorator;

export { resolverDecorator, checkResolver, checkTypeResolver, checkAction };
