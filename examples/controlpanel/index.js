const serveStatic = require('serve-static');

const path = `${__dirname}/out`;
const serve = serveStatic(path, {
  index: ['index.html'],
  extensions: ['html'],
  redirect: false,
  fallthrough: false
});

module.exports.embedControlpanelInMeteorWebApp = WebApp => {
  WebApp.connectHandlers.use('/', serve);
};
