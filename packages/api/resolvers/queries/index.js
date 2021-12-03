import { actions } from '../../roles';
import { checkResolver as acl } from '../../acl';

import activeWorkTypes from './activeWorkTypes';
import assortment from './assortment';
import assortments from './assortments';
import assortmentsCount from './assortmentsCount';
import countries from './countries/countries';
import countriesCount from './countries/countriesCount';
import country from './countries/country';
import currencies from './currencies/currencies';
import currenciesCount from './currencies/currenciesCount';
import currency from './currencies/currency';
import deliveryInterfaces from './deliveryInterfaces';
import deliveryProvider from './deliveryProvider';
import deliveryProviders from './deliveryProviders';
import deliveryProvidersCount from './deliveryProvidersCount';
import enrollment from './enrollment';
import enrollments from './enrollments';
import enrollmentsCount from './enrollmentsCount';
import event from './events/event';
import events from './events/events';
import eventsCount from './events/eventsCounts';
import filter from './filter';
import filters from './filters';
import filtersCount from './filtersCount';
import language from './languages/language';
import languages from './languages/languages';
import languagesCount from './languages/languagesCount';
import me from './users/me';
import order from './order';
import orders from './orders';
import ordersCount from './ordersCount';
import paymentInterfaces from './payment/paymentInterfaces';
import paymentProvider from './payment/paymentProvider';
import paymentProviders from './payment/paymentProviders';
import paymentProvidersCount from './payment/paymentProvidersCount';
import product from './product';
import productCatalogPrices from './productCatalogPrices';
import productReview from './productReview';
import productReviews from './productReviews';
import productReviewsCount from './productReviewsCount';
import products from './products';
import productsCount from './productsCount';
import quotation from './quotation';
import quotations from './quotations';
import quotationsCount from './quotationsCount';
import searchAssortments from './search-assortments';
import searchProducts from './search-products';
import shopInfo from './shopInfo';
import signPaymentProviderForCredentialRegistration from './signPaymentProviderForCredentialRegistration';
import translatedAssortmentMediaTexts from './translatedAssortmentMediaTexts';
import translatedAssortmentTexts from './translatedAssortmentTexts';
import translatedFilterTexts from './translatedFilterTexts';
import translatedProductMediaTexts from './translatedProductMediaTexts';
import translatedProductTexts from './translatedProductTexts';
import translatedProductVariationTexts from './translatedProductVariationTexts';
import user from './users/user';
import users from './users';
import usersCount from './usersCount';
import warehousingInterfaces from './warehousingInterfaces';
import warehousingProvider from './warehousingProvider';
import warehousingProviders from './warehousingProviders';
import warehousingProvidersCount from './warehousingProvidersCount';
import work from './work';
import workQueue from './workQueue';

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
  paymentProvidersCount: acl(actions.viewPaymentProviders)(
    paymentProvidersCount
  ),
  paymentProvider: acl(actions.viewPaymentProvider)(paymentProvider),
  paymentInterfaces: acl(actions.viewPaymentInterfaces)(paymentInterfaces),
  deliveryProvidersCount: acl(actions.viewDeliveryProviders)(
    deliveryProvidersCount
  ),
  deliveryProviders: acl(actions.viewDeliveryProviders)(deliveryProviders),
  deliveryProvider: acl(actions.viewDeliveryProvider)(deliveryProvider),
  deliveryInterfaces: acl(actions.viewDeliveryInterfaces)(deliveryInterfaces),
  warehousingProvidersCount: acl(actions.viewWarehousingProviders)(
    warehousingProvidersCount
  ),
  warehousingProviders: acl(actions.viewWarehousingProviders)(
    warehousingProviders
  ),
  warehousingProvider: acl(actions.viewWarehousingProvider)(
    warehousingProvider
  ),
  warehousingInterfaces: acl(actions.viewWarehousingInterfaces)(
    warehousingInterfaces
  ),
  translatedProductTexts: acl(actions.viewTranslations)(translatedProductTexts),
  translatedProductMediaTexts: acl(actions.viewTranslations)(
    translatedProductMediaTexts
  ),
  translatedProductVariationTexts: acl(actions.viewTranslations)(
    translatedProductVariationTexts
  ),
  ordersCount: acl(actions.viewOrders)(ordersCount),
  orders: acl(actions.viewOrders)(orders),
  order: acl(actions.viewOrder)(order),
  assortmentsCount: acl(actions.viewAssortments)(assortmentsCount),
  assortments: acl(actions.viewAssortments)(assortments),
  translatedAssortmentMediaTexts: acl(actions.viewAssortment)(
    translatedAssortmentMediaTexts
  ),
  assortment: acl(actions.viewAssortment)(assortment),
  filtersCount: acl(actions.viewFilters)(filtersCount),
  filters: acl(actions.viewFilters)(filters),
  filter: acl(actions.viewFilter)(filter),
  shopInfo: acl(actions.viewShopInfo)(shopInfo),
  translatedAssortmentTexts: acl(actions.manageAssortments)(
    translatedAssortmentTexts
  ),
  translatedFilterTexts: acl(actions.manageFilters)(translatedFilterTexts),
  productReview: acl(actions.manageProductReviews)(productReview),
  productReviews: acl(actions.manageProductReviews)(productReviews),
  productReviewsCount: acl(actions.manageProductReviews)(productReviewsCount),
  quotation: acl(actions.viewQuotation)(quotation),
  quotations: acl(actions.viewQuotations)(quotations),
  quotationsCount: acl(actions.viewQuotations)(quotationsCount),
  search: acl(actions.search)(searchProducts),
  searchProducts: acl(actions.search)(searchProducts),
  searchAssortments: acl(actions.search)(searchAssortments),
  workQueue: acl(actions.manageWorker)(workQueue),
  activeWorkTypes: acl(actions.manageWorker)(activeWorkTypes),
  enrollment: acl(actions.viewEnrollment)(enrollment),
  enrollments: acl(actions.viewEnrollments)(enrollments),
  enrollmentsCount: acl(actions.viewEnrollments)(enrollmentsCount),

  work: acl(actions.manageWorker)(work),
  signPaymentProviderForCredentialRegistration: acl(
    actions.registerPaymentCredentials
  )(signPaymentProviderForCredentialRegistration),
  event: acl(actions.viewEvent)(event),
  events: acl(actions.viewEvents)(events),
  eventsCount: acl(actions.viewEvents)(eventsCount),
};
