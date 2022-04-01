import { CheckPermissionArgs } from '@unchainedshop/types/roles';
import { Roles } from 'meteor/unchained:roles';
import { NoPermissionError, PermissionSystemError } from './errors';

const defaultOptions = {
  showKey: true,
  mapArgs: (...args) => args,
};

const emptyObject = {};
const emptyArray: CheckPermissionArgs = [];

const ensureActionExists = (action, userOptions) => {
  if (!action) {
    throw new PermissionSystemError({ userOptions });
  }
};

const ensureIsFunction = (fn, action, options, key) => {
  if (typeof fn !== 'function') {
    throw new PermissionSystemError({
      action,
      key: options.showKey ? key : '',
    });
  }
};

const checkAction = async (context, action, args = emptyArray, options: any = emptyObject) => {
  const { key } = options || emptyObject;

  const hasPermission = await Roles.userHasPermission(context, action, args);
  if (hasPermission) return;

  const keyText = key && key !== '' ? ` in "${key}"` : '';

  throw new NoPermissionError({
    userId: context.userId,
    action,
    key,
    message: `The user "${
      context.userId || ''
    }" has no permission to perform the action "${action}"${keyText}`,
  });
};

const wrapFunction = (fn, name, action, userOptions) => {
  const key = name || fn.name;
  const options = { ...defaultOptions, ...userOptions };
  ensureIsFunction(fn, action, options, key);
  return async (root, params, context, ...other) => {
    const args = options.mapArgs(root, params, ...other);
    await checkAction(context, action, args, {
      key: options.showKey ? key : '',
    });
    return fn(root, params, context, ...other);
  };
};

const checkResolver = (action, userOptions) => {
  ensureActionExists(action, userOptions);
  return (fn, name) => wrapFunction(fn, name, action, userOptions);
};

const checkTypeResolver = (action, key) =>
  async function _checkTypeResolver(obj, params, context) {
    await checkAction(context, action, [obj, params]);
    if (typeof obj[key] === 'function') {
      return obj[key](params, context);
    }
    return obj[key];
  };

const resolverDecorator = function resolverDecorator(action, userOptions) {
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

export default resolverDecorator;

// @resolverDecorator(action)
// resolverToBeChecked: () => ...

export { resolverDecorator, checkResolver, checkTypeResolver, checkAction };
