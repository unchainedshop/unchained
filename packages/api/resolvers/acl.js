import { checkPermission } from '../roles';
import { NoPermissionError, PermissionSystemError } from './errors';

const defaultOptions = {
  showKey: true,
  mapArgs: (...args) => args,
};

const emptyObject = {};
const emptyArray = [];

const ensureActionExists = (action, userOptions) => {
  if (!action) {
    throw new PermissionSystemError({
      data: {
        userOptions,
      },
    });
  }
};


const ensureIsFunction = (fn, action, options, key) => {
  if (typeof fn !== 'function') {
    throw new PermissionSystemError({
      data: {
        action,
        key: options.showKey ? key : '',
      },
    });
  }
};

const checkAction = (action, userId, args = emptyArray, options = emptyObject) => {
  const { key } = (options || emptyObject);
  const hasPermission = checkPermission(userId, action, ...args);
  if (hasPermission) return;
  const keyText = (key && key !== '') ? ` in "${key}"` : '';
  throw new NoPermissionError({
    data: {
      userId,
      action,
      key,
    },
    message: `The user "${userId || ''}" has no permission to perform the action "${action}"${keyText}`,
  });
};

const wrapFunction = (fn, name, action, userOptions) => {
  const key = name || fn.name;
  const options = { ...defaultOptions, ...userOptions };
  ensureIsFunction(fn, action, options, key);
  return (root, params, context, ...other) => {
    const args = options.mapArgs(root, params, context, ...other);
    checkAction(action, context.userId, args, {
      key: options.showKey ? key : '',
    });
    return fn(root, params, context, ...other);
  };
};

const checkResolver = (action, userOptions) => {
  ensureActionExists(action, userOptions);
  return (fn, name) => wrapFunction(fn, name, action, userOptions);
};

const checkTypeResolver = (action, key) => function _checkTypeResolver(obj, params, context) {
  checkAction(action, context.userId, [obj, params, context]);
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

export {
  resolverDecorator,
  checkResolver,
  checkTypeResolver,
  checkPermission,
  checkAction,
};
