import { actions } from '../../roles/index.js';
import { checkResolver as acl } from '../../acl.js';

import activeWorkTypes from './worker/activeWorkTypes.js';
import assortment from './assortments/assortment.js';
import assortments from './assortments/assortments.js';
import assortmentsCount from './assortments/assortmentsCount.js';
import countries from './countries/countries.js';
import countriesCount from './countries/countriesCount.js';
import country from './countries/country.js';
import currencies from './currencies/currencies.js';
import currenciesCount from './currencies/currenciesCount.js';
import currency from './currencies/currency.js';
import deliveryInterfaces from './delivery/deliveryInterfaces.js';
import deliveryProvider from './delivery/deliveryProvider.js';
import deliveryProviders from './delivery/deliveryProviders.js';
import deliveryProvidersCount from './delivery/deliveryProvidersCount.js';
import enrollment from './enrollments/enrollment.js';
import enrollments from './enrollments/enrollments.js';
import enrollmentsCount from './enrollments/enrollmentsCount.js';
import event from './events/event.js';
import events from './events/events.js';
import eventsCount from './events/eventsCounts.js';
import filter from './filters/filter.js';
import filters from './filters/filters.js';
import filtersCount from './filters/filtersCount.js';
import language from './languages/language.js';
import languages from './languages/languages.js';
import languagesCount from './languages/languagesCount.js';
import me from './users/me.js';
import order from './orders/order.js';
import orders from './orders/orders.js';
import ordersCount from './orders/ordersCount.js';
import paymentInterfaces from './payment/paymentInterfaces.js';
import paymentProvider from './payment/paymentProvider.js';
import paymentProviders from './payment/paymentProviders.js';
import paymentProvidersCount from './payment/paymentProvidersCount.js';
import product from './products/product.js';
import productCatalogPrices from './products/productCatalogPrices.js';
import productReview from './products/productReview.js';
import productReviews from './products/productReviews.js';
import productReviewsCount from './products/productReviewsCount.js';
import products from './products/products.js';
import productsCount from './products/productsCount.js';
import quotation from './quotations/quotation.js';
import quotations from './quotations/quotations.js';
import quotationsCount from './quotations/quotationsCount.js';
import searchAssortments from './filters/searchAssortments.js';
import searchProducts from './filters/searchProducts.js';
import shopInfo from './shopInfo.js';
import translatedAssortmentMediaTexts from './assortments/translatedAssortmentMediaTexts.js';
import translatedAssortmentTexts from './assortments/translatedAssortmentTexts.js';
import translatedFilterTexts from './filters/translatedFilterTexts.js';
import translatedProductMediaTexts from './products/translatedProductMediaTexts.js';
import translatedProductTexts from './products/translatedProductTexts.js';
import translatedProductVariationTexts from './products/translatedProductVariationTexts.js';
import user from './users/user.js';
import users from './users/users.js';
import usersCount from './users/usersCount.js';
import warehousingInterfaces from './warehousing/warehousingInterfaces.js';
import warehousingProvider from './warehousing/warehousingProvider.js';
import warehousingProviders from './warehousing/warehousingProviders.js';
import warehousingProvidersCount from './warehousing/warehousingProvidersCount.js';
import token from './warehousing/token.js';
import work from './worker/work.js';
import workQueue from './worker/workQueue.js';
import workQueueCount from './worker/workQueueCount.js';

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
  token: acl(actions.viewToken)(token),
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
