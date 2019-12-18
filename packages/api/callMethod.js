import { Meteor } from 'meteor/meteor';
import getConnection from './getConnection';

export default function(passedContext, name, ...args) {
  const handler = Meteor.default_server.method_handlers[name];
  if (!handler) {
    throw new Meteor.Error(404, `Method '${name}' not found`);
  }

  const connection = getConnection();
  const context = {
    connection,
    setUserId(userId) { // eslint-disable-line
      /**
       * This will not make any changes if you don\'t pass setUserId function in context
       */
    },
    ...passedContext
  };
  const { userId: userIdBeforeLogin, ...handlerContext } = passedContext;

  const retValue = handler.call(context, ...args, {
    userIdBeforeLogin,
    ...handlerContext
  });
  connection.close();
  return retValue;
}
