import { actions } from '../../roles';
import { checkResolver as acl } from '../acl';

import me from './me';
import user from './user';
import users from './users';
import product from './product';
import products from './products';
import productCatalogPrices from './productCatalogPrices';
import languages from './languages';
import language from './language';
import countries from './countries';
import country from './country';
import currencies from './currencies';
import currency from './currency';
import translatedProductTexts from './translatedProductTexts';
import translatedProductMediaTexts from './translatedProductMediaTexts';
import translatedProductVariationTexts from './translatedProductVariationTexts';
import paymentProviders from './paymentProviders';
import paymentProvider from './paymentProvider';
import paymentInterfaces from './paymentInterfaces';
import deliveryProviders from './deliveryProviders';
import deliveryProvider from './deliveryProvider';
import deliveryInterfaces from './deliveryInterfaces';
import warehousingProviders from './warehousingProviders';
import warehousingProvider from './warehousingProvider';
import warehousingInterfaces from './warehousingInterfaces';
import orders from './orders';
import order from './order';
import assortment from './assortment';
import assortments from './assortments';
import translatedAssortmentTexts from './translatedAssortmentTexts';
import logs from './logs';
import shopInfo from './shopInfo';

export default {
  me,
  user: acl(actions.viewUser)(user),
  users: acl(actions.viewUsers)(users),
  product: acl(actions.viewProduct)(product),
  products: acl(actions.viewProducts)(products),
  productCatalogPrices: acl(actions.viewProduct)(productCatalogPrices),
  languages: acl(actions.viewLanguages)(languages),
  language: acl(actions.viewLanguage)(language),
  countries: acl(actions.viewCountries)(countries),
  country: acl(actions.viewCountry)(country),
  currencies: acl(actions.viewCurrencies)(currencies),
  currency: acl(actions.viewCurrency)(currency),
  paymentProviders: acl(actions.viewPaymentProviders)(paymentProviders),
  paymentProvider: acl(actions.viewPaymentProvider)(paymentProvider),
  paymentInterfaces: acl(actions.viewPaymentInterfaces)(paymentInterfaces),
  deliveryProviders: acl(actions.viewDeliveryProviders)(deliveryProviders),
  deliveryProvider: acl(actions.viewDeliveryProvider)(deliveryProvider),
  deliveryInterfaces: acl(actions.viewDeliveryInterfaces)(deliveryInterfaces),
  warehousingProviders: acl(actions.viewWarehousingProviders)(warehousingProviders),
  warehousingProvider: acl(actions.viewWarehousingProvider)(warehousingProvider),
  warehousingInterfaces: acl(actions.viewWarehousingInterfaces)(warehousingInterfaces),
  translatedProductTexts: acl(actions.viewTranslations)(translatedProductTexts),
  translatedProductMediaTexts: acl(actions.viewTranslations)(translatedProductMediaTexts),
  translatedProductVariationTexts: acl(actions.viewTranslations)(translatedProductVariationTexts),
  orders: acl(actions.viewOrders)(orders),
  order: acl(actions.viewOrder)(order),
  assortments: acl(actions.viewAssortments)(assortments),
  assortment: acl(actions.viewAssortment)(assortment),
  shopInfo: acl(actions.viewShopInfo)(shopInfo),
  logs: acl(actions.viewLogs)(logs),
  translatedAssortmentTexts: acl(actions.manageAssortments)(translatedAssortmentTexts),
};
