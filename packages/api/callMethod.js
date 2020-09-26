import { Meteor } from 'meteor/meteor';
import getConnection from './getConnection';

export const filterContext = (graphqlContext) => {
  return Object.fromEntries(
    Object.entries(graphqlContext).filter(([key]) => {
      if (key.substr(0, 1) === '_') return false;
      return true;
    }),
  );
};

export const evaluateContext = (filteredContext) => {
  const {
    userId: userIdBeforeLogin,
    localeContext,
    ...handlerContext
  } = filteredContext;

  return {
    userIdBeforeLogin,
    normalizedLocale: localeContext && localeContext.normalized,
    ...handlerContext,
  };
};

export default function callMethod(passedContext, name, ...args) {
  const handler = Meteor.default_server.method_handlers[name];
  if (!handler) {
    throw new Meteor.Error(404, `Method '${name}' not found`);
  }
  const filteredContext = filterContext(passedContext);
  const connection = getConnection();
  const context = {
    connection,
    // eslint-disable-next-line
    setUserId(userId) {
      /**
       * This will not make any changes if you don\'t pass setUserId function in context
       */
    },
    ...filteredContext,
  };

  const retValue = handler.call(
    context,
    ...args,
    evaluateContext(filteredContext),
  );
  connection.close();
  return retValue;
}
