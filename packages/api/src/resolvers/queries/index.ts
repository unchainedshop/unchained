import { actions } from '../../roles/index.ts';
import { checkResolver as acl } from '../../acl.ts';

import activeWorkTypes from './worker/activeWorkTypes.ts';
import assortment from './assortments/assortment.ts';
import assortments from './assortments/assortments.ts';
import assortmentsCount from './assortments/assortmentsCount.ts';
import countries from './countries/countries.ts';
import countriesCount from './countries/countriesCount.ts';
import country from './countries/country.ts';
import currencies from './currencies/currencies.ts';
import currenciesCount from './currencies/currenciesCount.ts';
import currency from './currencies/currency.ts';
import deliveryInterfaces from './delivery/deliveryInterfaces.ts';
import deliveryProvider from './delivery/deliveryProvider.ts';
import deliveryProviders from './delivery/deliveryProviders.ts';
import deliveryProvidersCount from './delivery/deliveryProvidersCount.ts';
import enrollment from './enrollments/enrollment.ts';
import enrollments from './enrollments/enrollments.ts';
import enrollmentsCount from './enrollments/enrollmentsCount.ts';
import event from './events/event.ts';
import events from './events/events.ts';
import eventsCount from './events/eventsCounts.ts';
import filter from './filters/filter.ts';
import filters from './filters/filters.ts';
import filtersCount from './filters/filtersCount.ts';
import language from './languages/language.ts';
import languages from './languages/languages.ts';
import languagesCount from './languages/languagesCount.ts';
import me from './users/me.ts';
import order from './orders/order.ts';
import orders from './orders/orders.ts';
import ordersCount from './orders/ordersCount.ts';
import paymentInterfaces from './payment/paymentInterfaces.ts';
import paymentProvider from './payment/paymentProvider.ts';
import paymentProviders from './payment/paymentProviders.ts';
import paymentProvidersCount from './payment/paymentProvidersCount.ts';
import product from './products/product.ts';
import productCatalogPrices from './products/productCatalogPrices.ts';
import productReview from './products/productReview.ts';
import productReviews from './products/productReviews.ts';
import productReviewsCount from './products/productReviewsCount.ts';
import products from './products/products.ts';
import productsCount from './products/productsCount.ts';
import quotation from './quotations/quotation.ts';
import quotations from './quotations/quotations.ts';
import quotationsCount from './quotations/quotationsCount.ts';
import searchAssortments from './filters/searchAssortments.ts';
import searchProducts from './filters/searchProducts.ts';
import shopInfo from './shopInfo.ts';
import translatedAssortmentMediaTexts from './assortments/translatedAssortmentMediaTexts.ts';
import translatedAssortmentTexts from './assortments/translatedAssortmentTexts.ts';
import translatedFilterTexts from './filters/translatedFilterTexts.ts';
import translatedProductMediaTexts from './products/translatedProductMediaTexts.ts';
import translatedProductTexts from './products/translatedProductTexts.ts';
import translatedProductVariationTexts from './products/translatedProductVariationTexts.ts';
import user from './users/user.ts';
import users from './users/users.ts';
import usersCount from './users/usersCount.ts';
import warehousingInterfaces from './warehousing/warehousingInterfaces.ts';
import warehousingProvider from './warehousing/warehousingProvider.ts';
import warehousingProviders from './warehousing/warehousingProviders.ts';
import warehousingProvidersCount from './warehousing/warehousingProvidersCount.ts';
import token from './warehousing/token.ts';
import tokens from './warehousing/tokens.ts';
import tokensCount from './warehousing/tokensCount.ts';
import work from './worker/work.ts';
import workQueue from './worker/workQueue.ts';
import workStatistics from './worker/workStatistics.ts';
import workQueueCount from './worker/workQueueCount.ts';
import validateResetPasswordToken from './users/validateResetPasswordToken.ts';
import validateVerifyEmailToken from './users/validateVerifyEmailToken.ts';
import eventStatistics from './events/eventStatistics.ts';
import orderStatistics from './orders/orderStatistics.ts';
import impersonator from './users/impersonator.ts';

export default {
  me,
  impersonator,
  user: acl(actions.viewUser)(user),
  users: acl(actions.viewUsers)(users),
  usersCount: acl(actions.viewUserCount)(usersCount),
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
  tokens: acl(actions.viewTokens)(tokens),
  tokensCount: acl(actions.viewTokens)(tokensCount),
  translatedProductTexts: acl(actions.viewTranslations)(translatedProductTexts),
  translatedProductMediaTexts: acl(actions.viewTranslations)(translatedProductMediaTexts),
  translatedProductVariationTexts: acl(actions.viewTranslations)(translatedProductVariationTexts),
  ordersCount: acl(actions.viewOrders)(ordersCount),
  orders: acl(actions.viewOrders)(orders),
  order: acl(actions.viewOrder)(order),
  assortmentsCount: acl(actions.viewAssortments)(assortmentsCount),
  assortments: acl(actions.viewAssortments)(assortments),
  translatedAssortmentMediaTexts: acl(actions.viewTranslations)(translatedAssortmentMediaTexts),
  assortment: acl(actions.viewAssortment)(assortment),
  filtersCount: acl(actions.viewFilters)(filtersCount),
  filters: acl(actions.viewFilters)(filters),
  filter: acl(actions.viewFilter)(filter),
  shopInfo: acl(actions.viewShopInfo)(shopInfo),
  translatedAssortmentTexts: acl(actions.viewTranslations)(translatedAssortmentTexts),
  translatedFilterTexts: acl(actions.viewTranslations)(translatedFilterTexts),
  productReview: acl(actions.manageProductReviews)(productReview),
  productReviews: acl(actions.manageProductReviews)(productReviews),
  productReviewsCount: acl(actions.manageProductReviews)(productReviewsCount),
  quotation: acl(actions.viewQuotation)(quotation),
  quotations: acl(actions.viewQuotations)(quotations),
  quotationsCount: acl(actions.viewQuotations)(quotationsCount),
  searchProducts: acl(actions.search)(searchProducts),
  searchAssortments: acl(actions.search)(searchAssortments),
  workQueue: acl(actions.viewWorkQueue)(workQueue),
  workQueueCount: acl(actions.viewWorkQueue)(workQueueCount),
  activeWorkTypes: acl(actions.viewWorkQueue)(activeWorkTypes),
  enrollment: acl(actions.viewEnrollment)(enrollment),
  enrollments: acl(actions.viewEnrollments)(enrollments),
  enrollmentsCount: acl(actions.viewEnrollments)(enrollmentsCount),
  work: acl(actions.viewWork)(work),
  event: acl(actions.viewEvent)(event),
  events: acl(actions.viewEvents)(events),
  eventsCount: acl(actions.viewEvents)(eventsCount),
  validateResetPasswordToken: acl(actions.resetPassword)(validateResetPasswordToken),
  validateVerifyEmailToken: acl(actions.verifyEmail)(validateVerifyEmailToken),
  workStatistics: acl(actions.viewStatistics)(workStatistics),
  eventStatistics: acl(actions.viewStatistics)(eventStatistics),
  orderStatistics: acl(actions.viewStatistics)(orderStatistics),
};
