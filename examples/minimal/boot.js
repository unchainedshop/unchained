import { Meteor } from 'meteor/meteor';
import { startPlatform } from 'meteor/unchained:platform';
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';

import 'meteor/unchained:core-delivery/plugins/post';
import 'meteor/unchained:core-delivery/plugins/pick-mup';
import 'meteor/unchained:core-delivery/plugins/send-message';
import 'meteor/unchained:core-delivery/plugins/stores';
import 'meteor/unchained:core-delivery/plugins/free-delivery';
import 'meteor/unchained:core-delivery/plugins/delivery-swiss-tax';

import 'meteor/unchained:core-warehousing/plugins/google-sheets';

import 'meteor/unchained:core-orders/plugins/discount-half-price-manual';
import 'meteor/unchained:core-orders/plugins/discount-100-off';

import 'meteor/unchained:core-payment/plugins/invoice';
import 'meteor/unchained:core-payment/plugins/invoice-prepaid';
// import 'meteor/unchained:core-payment/plugins/datatrans-v2';
import 'meteor/unchained:core-payment/plugins/paypal-checkout';
import 'meteor/unchained:core-payment/plugins/cryptopay';
import { configureAppleTransactionsModule } from 'meteor/unchained:core-payment/plugins/apple-iap';
import 'meteor/unchained:core-payment/plugins/stripe';
import 'meteor/unchained:core-payment/plugins/stripe-charges';
import 'meteor/unchained:core-payment/plugins/postfinance-checkout';
import { configureBityModule } from 'meteor/unchained:core-payment/plugins/bity';
import 'meteor/unchained:core-payment/plugins/free-payment';

import 'meteor/unchained:core-orders/plugins/order-items';
import 'meteor/unchained:core-orders/plugins/order-discount';
import 'meteor/unchained:core-orders/plugins/order-delivery';
import 'meteor/unchained:core-orders/plugins/order-payment';

import 'meteor/unchained:core-products/plugins/product-catalog-price';
import 'meteor/unchained:core-products/plugins/product-price-coinbase-exchange';
import 'meteor/unchained:core-products/plugins/product-price-cryptopay';
import 'meteor/unchained:core-products/plugins/product-price-rateconversion';
import 'meteor/unchained:core-products/plugins/product-discount';
import 'meteor/unchained:core-products/plugins/product-swiss-tax';

import 'meteor/unchained:core-filters/plugins/strict-equal';
import 'meteor/unchained:core-filters/plugins/local-search';

import 'meteor/unchained:core-quotations/plugins/manual';

import 'meteor/unchained:core-enrollments/plugins/licensed';

import 'meteor/unchained:core-worker/plugins/external';
import 'meteor/unchained:core-worker/plugins/http-request';
import 'meteor/unchained:core-worker/plugins/heartbeat';
import 'meteor/unchained:core-worker/plugins/email';
import 'meteor/unchained:core-worker/plugins/sms';

// import 'meteor/unchained:file-upload/plugins/gridfs/gridfs-adapter';
// import 'meteor/unchained:file-upload/plugins/gridfs/gridfs-webhook';
// import { configureGridFSFileUploadModule } from 'meteor/unchained:file-upload/plugins/gridfs';

import 'meteor/unchained:file-upload/plugins/minio-adapter';
import 'meteor/unchained:file-upload/plugins/minio-webhook';

import 'meteor/unchained:events/plugins/node-event-emitter';

import loginWithSingleSignOn from './login-with-single-sign-on';
import seed from './seed';

const context = async ({ req, unchainedContextFn, ...rest }) => {
  const unchainedContext = await unchainedContextFn({ req, ...rest });
  const newContext = {
    ...unchainedContext,
  };
  if (!unchainedContext.userId && req.headers.authorization) {
    const [type, userToken] = req.headers.authorization.split(' ');
    if (type === 'Bearer' && userToken) {
      const [username, secret] = userToken.split(':');
      const user = await unchainedContext.modules.users.findUser({ username });
      if (secret && user?.services.token?.secret === secret) {
        newContext.userId = user._id;
        newContext.user = user;
      }
    } else {
      // eslint-disable-next-line
      console.warn('Token login failed');
    }
  }
  return newContext;
};

Meteor.startup(async () => {
  const unchainedApi = await startPlatform({
    introspection: true,
    playground: true,
    tracing: true,
    modules: {
      bity: {
        configure: configureBityModule,
      },
      appleTransactions: {
        configure: configureAppleTransactionsModule,
      },
      // gridfsFileUploads: {
      //   configure: configureGridFSFileUploadModule,
      // },
    },
    options: {
      accounts: {
        password: {
          twoFactor: {
            appName: 'Example',
          },
        },
      },
      payment: {
        filterSupportedProviders: ({ providers }) => {
          return providers.sort((left, right) => {
            if (left.adapterKey < right.adapterKey) {
              return -1;
            }
            if (left.adapterKey > right.adapterKey) {
              return 1;
            }
            return 0;
          });
        },
      },
    },
    context,
  });

  seed(unchainedApi);

  // The following lines will activate SSO from Unchained Cloud to your instance,
  // if you want to further secure your app and close this rabbit hole,
  // remove the following lines
  WebApp.connectHandlers.use('/', (req, res, next) => {
    if (req.query?.token) {
      loginWithSingleSignOn(req.query.token).then((authCookie) => {
        if (res?.setHeader) {
          res.setHeader('Set-Cookie', authCookie);
          next();
        }
      });
    } else {
      next();
    }
  });
  // until here

  embedControlpanelInMeteorWebApp(WebApp);
});
