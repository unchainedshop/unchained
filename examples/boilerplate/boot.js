import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { startPlatform } from 'meteor/unchained:platform';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';


import '@unchainedshop/core-events/plugins/node-event-emitter';
import './plugins/sausage'

import seed from './seed';

Meteor.startup(async () => {
  await startPlatform({
    introspection: true,

  });

  seed();

  embedControlpanelInMeteorWebApp(WebApp);
});
