import { actions } from '../../roles';
import { checkResolver as acl } from '../../acl';

import activeWorkTypes from './worker/activeWorkTypes';
import assortment from './assortments/assortment';
import assortments from './assortments/assortments';
import assortmentsCount from './assortments/assortmentsCount';
import countries from './countries/countries';
import countriesCount from './countries/countriesCount';
import country from './countries/country';
import currencies from './currencies/currencies';
import currenciesCount from './currencies/currenciesCount';
import currency from './currencies/currency';
import deliveryInterfaces from './delivery/deliveryInterfaces';
import deliveryProvider from './delivery/deliveryProvider';
import deliveryProviders from './delivery/deliveryProviders';
import deliveryProvidersCount from './delivery/deliveryProvidersCount';
import enrollment from './enrollments/enrollment';
import enrollments from './enrollments/enrollments';
import enrollmentsCount from './enrollments/enrollmentsCount';
import event from './events/event';
import events from './events/events';
import eventsCount from './events/eventsCounts';
import filter from './filters/filter';
import filters from './filters/filters';
import filtersCount from './filters/filtersCount';
import language from './languages/language';
import languages from './languages/languages';
import languagesCount from './languages/languagesCount';
import me from './users/me';
import order from './orders/order';
import orders from './orders/orders';
import ordersCount from './orders/ordersCount';
import paymentInterfaces from './payment/paymentInterfaces';
import paymentProvider from './payment/paymentProvider';
import paymentProviders from './payment/paymentProviders';
import paymentProvidersCount from './payment/paymentProvidersCount';
import product from './products/product';
import productCatalogPrices from './products/productCatalogPrices';
import productReview from './products/productReview';
import productReviews from './products/productReviews';
import productReviewsCount from './products/productReviewsCount';
import products from './products/products';
import productsCount from './products/productsCount';
import quotation from './quotations/quotation';
import quotations from './quotations/quotations';
import quotationsCount from './quotations/quotationsCount';
import searchAssortments from './filters/searchAssortments';
import searchProducts from './filters/searchProducts';
import shopInfo from './shopInfo';
import translatedAssortmentMediaTexts from './assortments/translatedAssortmentMediaTexts';
import translatedAssortmentTexts from './assortments/translatedAssortmentTexts';
import translatedFilterTexts from './filters/translatedFilterTexts';
import translatedProductMediaTexts from './products/translatedProductMediaTexts';
import translatedProductTexts from './products/translatedProductTexts';
import translatedProductVariationTexts from './products/translatedProductVariationTexts';
import user from './users/user';
import users from './users/users';
import usersCount from './users/usersCount';
import warehousingInterfaces from './warehousing/warehousingInterfaces';
import warehousingProvider from './warehousing/warehousingProvider';
import warehousingProviders from './warehousing/warehousingProviders';
import warehousingProvidersCount from './warehousing/warehousingProvidersCount';
import work from './worker/work';
import workQueue from './worker/workQueue';
import workQueueCount from './worker/workQueueCount';

export default {
  me,
  user: acl(actions.viewUser)(user),
  users: acl(actions.viewUsers)(users),
  usersCount: acl(actions.viewUsers)(usersCount),
  product: acl(actions.viewProduct)(product),
  products: acl(actions.viewProducts)(products),
  productsCount: acl(actions.viewProducts)(productsCount),
  productCatalogPrices: acl(actions.viewProduct)(productCatalogPrices),
  languagesCount: acl(actions.viewLanguages)(languagesCount),
  languages: acl(actions.viewLanguages)(languages),
  language: acl(actions.viewLanguage)(language),
  countriesCount: acl(actions.viewCountries)(countriesCount),
  countries: acl(actions.viewCountries)(countries),
  country: acl(actions.viewCountry)(country),
  currenciesCount: acl(actions.viewCurrencies)(currenciesCount),
  currencies: acl(actions.viewCurrencies)(currencies),
  currency: acl(actions.viewCurrency)(currency),
  paymentProviders: acl(actions.viewPaymentProviders)(paymentProviders),
  paymentProvidersCount: acl(actions.viewPaymentProviders)(paymentProvidersCount),
  paymentProvider: acl(actions.viewPaymentProvider)(paymentProvider),
  paymentInterfaces: acl(actions.viewPaymentInterfaces)(paymentInterfaces),
  deliveryProvidersCount: acl(actions.viewDeliveryProviders)(deliveryProvidersCount),
  deliveryProviders: acl(actions.viewDeliveryProviders)(deliveryProviders),
  deliveryProvider: acl(actions.viewDeliveryProvider)(deliveryProvider),
  deliveryInterfaces: acl(actions.viewDeliveryInterfaces)(deliveryInterfaces),
  warehousingProvidersCount: acl(actions.viewWarehousingProviders)(warehousingProvidersCount),
  warehousingProviders: acl(actions.viewWarehousingProviders)(warehousingProviders),
  warehousingProvider: acl(actions.viewWarehousingProvider)(warehousingProvider),
  warehousingInterfaces: acl(actions.viewWarehousingInterfaces)(warehousingInterfaces),
  translatedProductTexts: acl(actions.viewTranslations)(translatedProductTexts),
  translatedProductMediaTexts: acl(actions.viewTranslations)(translatedProductMediaTexts),
  translatedProductVariationTexts: acl(actions.viewTranslations)(translatedProductVariationTexts),
  ordersCount: acl(actions.viewOrders)(ordersCount),
  orders: acl(actions.viewOrders)(orders),
  order: acl(actions.viewOrder)(order),
  assortmentsCount: acl(actions.viewAssortments)(assortmentsCount),
  assortments: acl(actions.viewAssortments)(assortments),
  translatedAssortmentMediaTexts: acl(actions.viewAssortment)(translatedAssortmentMediaTexts),
  assortment: acl(actions.viewAssortment)(assortment),
  filtersCount: acl(actions.viewFilters)(filtersCount),
  filters: acl(actions.viewFilters)(filters),
  filter: acl(actions.viewFilter)(filter),
  shopInfo: acl(actions.viewShopInfo)(shopInfo),
  translatedAssortmentTexts: acl(actions.manageAssortments)(translatedAssortmentTexts),
  translatedFilterTexts: acl(actions.manageFilters)(translatedFilterTexts),
  productReview: acl(actions.manageProductReviews)(productReview),
  productReviews: acl(actions.manageProductReviews)(productReviews),
  productReviewsCount: acl(actions.manageProductReviews)(productReviewsCount),
  quotation: acl(actions.viewQuotation)(quotation),
  quotations: acl(actions.viewQuotations)(quotations),
  quotationsCount: acl(actions.viewQuotations)(quotationsCount),
  searchProducts: acl(actions.search)(searchProducts),
  searchAssortments: acl(actions.search)(searchAssortments),
  workQueue: acl(actions.manageWorker)(workQueue),
  workQueueCount: acl(actions.manageWorker)(workQueueCount),
  activeWorkTypes: acl(actions.manageWorker)(activeWorkTypes),
  enrollment: acl(actions.viewEnrollment)(enrollment),
  enrollments: acl(actions.viewEnrollments)(enrollments),
  enrollmentsCount: acl(actions.viewEnrollments)(enrollmentsCount),

  work: acl(actions.manageWorker)(work),
  event: acl(actions.viewEvent)(event),
  events: acl(actions.viewEvents)(events),
  eventsCount: acl(actions.viewEvents)(eventsCount),
};
