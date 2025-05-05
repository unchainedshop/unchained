import { DeliveryAdapter, DeliveryDirector, DeliveryError, IDeliveryAdapter } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

const fetchPickMupLocations = async (key: string, idsFilter?: string) => {
  // const pickMupUrl = `https://web-api.migros.ch/widgets/stores?key=${key}&verbosity=detail&limit=5000&aggregation_options%5Bempty_buckets%5D=true&filters%5Bmarkets%5D%5B0%5D%5B%5D=super&filters%5Bmarkets%5D%5B0%5D%5B%5D=mno&filters%5Bmarkets%5D%5B0%5D%5B%5D=voi&filters%5Bmarkets%5D%5B0%5D%5B%5D=mp&filters%5Bmarkets%5D%5B0%5D%5B%5D=out&filters%5Bmarkets%5D%5B0%5D%5B%5D=spx&filters%5Bmarkets%5D%5B0%5D%5B%5D=doi&filters%5Bmarkets%5D%5B0%5D%5B%5D=mec&filters%5Bmarkets%5D%5B0%5D%5B%5D=mica&filters%5Bmarkets%5D%5B0%5D%5B%5D=res&filters%5Bmarkets%5D%5B0%5D%5B%5D=flori&filters%5Bmarkets%5D%5B0%5D%5B%5D=gour&filters%5Bmarkets%5D%5B0%5D%5B%5D=alna&filters%5Bmarkets%5D%5B0%5D%5B%5D=cof&filters%5Bmarkets%5D%5B0%5D%5B%5D=chng&filters%5Bservices%5D%5Bsub_type%5D%5B%5D=pickmup&aggregation_groups%5B_custom%5D%5Bopen_on%5D%5Bnow%5D=20190923T11%3A45&aggregation_groups%5B_custom%5D%5Bopen_on%5D%5Bafter_1900%5D=20190923T19%3A01&aggregation_groups%5B_custom%5D%5Bopen_on%5D%5Bsundays%5D=sunday&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=super&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=voi&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=mp&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=mec&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=spx&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=doi&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=mica&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=out&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=flori&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=alna&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=res&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=gour&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=cof&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=res&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=gour&aggregation_groups%5Bmarkets%5D%5B_terms%5D%5B%5D=cof&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=market-service-mig_clean&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=market-service-mig_online&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=pickmup&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=post-service-point&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=subito-selfscanning&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=subito-selfcheckout&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=market-service-mig_bakery&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=counter-mez&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=counter-fisch&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=counter-kaes&aggregation_groups%5Bservices%5D%5Bsub_type%5D%5B_terms%5D%5B%5D=srv`;
  const pickMupUrl = '';

  const data = await fetch(`${pickMupUrl}${idsFilter ? `&ids[]=${idsFilter}` : ''}`, {
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'de',
      'sec-fetch-mode': 'cors',
      origin: 'https://filialen.migros.ch',
      DNT: '1',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
    },
    body: null,
    method: 'GET',
  });
  const result: any = await data.json();
  const { stores = [] } = result || {};
  return stores.flatMap(({ markets = [], location = {}, id }) => {
    return markets.map(({ full_name: fullName }) => {
       
      const {
        geo: { lat, lon },
        zip,
        country,
        address,
        city,
        address2,
      } = location as any;
      return {
        _id: id,
        name: fullName,
        address: {
          addressLine: address,
          addressLine2: address2,
          postalCode: zip,
          countryCode: country,
          city,
        },
        geoPoint: {
          latitude: lat,
          longitude: lon,
        },
      };
    });
  });
};

const PickMup: IDeliveryAdapter = {
  ...DeliveryAdapter,

  key: 'shop.unchained.pick-mup',
  label: 'Migros PickMUp',
  version: '1.0.0',

  initialConfiguration: [
    {
      key: 'key',
      value: '',
    },
  ],

  typeSupported: (type) => {
    return type === DeliveryProviderType.PICKUP;
  },

  actions: (config, context) => {
    const getKey = () => {
      // Load https://filialen.migros.ch/de/filter:market_services-pickmup, open the browser developer tools and look for the sessionKey:
      // <html lang="de" data-setup="{'env': 'production','sessionKey': '8ApUDaqeNER3Mest'}" class="no-js">
      return config.reduce((current, item) => {
        if (item.key === 'key') return item.value;
        return current;
      }, '');
    };

    return {
      ...DeliveryAdapter.actions(config, context),

      isActive: () => {
        return true;
      },

      isAutoReleaseAllowed: () => {
        return true;
      },

      configurationError: () => {
         
        if (!getKey()) {
          return DeliveryError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      pickUpLocationById: async (id) => {
        const [foundLocation] = await fetchPickMupLocations(getKey(), id);
        return foundLocation;
      },

      pickUpLocations: async () => {
        const result = await fetchPickMupLocations(getKey());
        return result;
      },

      send: async () => {
        return false;
      },
    };
  },
};

DeliveryDirector.registerAdapter(PickMup);
