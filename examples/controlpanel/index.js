const { parse } = require('url');
const next = require('next');

const app = next({
  dev: false,
  dir: __dirname
});
const handle = app.getRequestHandler();

module.exports = handle;

module.exports.embedControlpanelInMeteorWebApp = WebApp => {
  WebApp.connectHandlers.use('/', (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });
};
