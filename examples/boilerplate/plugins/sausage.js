import { ProductPricingDirector, ProductPricingAdapter } from 'meteor/unchained:core-pricing';
import fetch from 'isomorphic-unfetch';

const PRODUCT_TAG_SAUSAGE = 'sausage';
const SAUSAGE_THRESHOLD_CELSIUS = 20;

// TODO: Migrate
class WeatherDependentBarbequeSausagePricing extends ProductPricingAdapter {
  static key = 'shop.unchained.wd-bbq-sausage-pricing';
  static version = '1.0';
  static label = 'Calculate the price of a sausage 🌭🌦';
  static orderIndex = 3;

  static isActivatedFor({ product }) {
    if (product.tags && product.tags.length > 0 && product.tags.indexOf(PRODUCT_TAG_SAUSAGE) !== -1) {
      return true;
    }
    return false;
  }

  async calculate() {
    const { currency, quantity } = this.context;
    try {
      const response = await fetch(
        'https://community-open-weather-map.p.rapidapi.com/weather?q=zurich,ch&units=metric',
        {
          headers: {
            'x-rapidapi-key': '2a849e288dmsh59370f28a9102f6p1c881cjsn28010ce8ff58',
            'x-rapidapi-host': 'community-open-weather-map.p.rapidapi.com',
            useQueryString: true,
          },
        },
      );
      if (response.status === 200) {
        const { main } = await response.json();
        const { temp } = main;
        if (temp) {
          if (temp > SAUSAGE_THRESHOLD_CELSIUS) {
            console.log('🌭 -> High season, sausage pricy!!'); // eslint-disable-line
            this.result.addItem({
              currency,
              amount: 100 * quantity,
              isTaxable: true,
              isNetPrice: true,
              meta: { adapter: this.constructor.key },
            });
          }
        }
      }
    } catch (e) {
      console.error(`🌭 -> Failed while trying to price weather dependent ${e.message}`); // eslint-disable-line
    }

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(WeatherDependentBarbequeSausagePricing);
