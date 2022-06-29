import { WebApp } from 'meteor/webapp';
import { startPlatform } from '@unchainedshop/platform';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';


import '@unchainedshop/core-events/plugins/node-event-emitter';
import './plugins/sausage'

import seed from './seed';

startPlatform({
  introspection: true,
}).then(api => {
  seed(api);
});

embedControlpanelInMeteorWebApp(WebApp);
