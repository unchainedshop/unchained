Document interface
fix the cart price



DeliveryAdapter: IdeliveryAdapter
- key: string
- label: string
- version: string
- initialConfiguration: array
- typeSupported → function
- actions → function returns object with the following properties
	 configurationError: String function
	estimateDeliveryThroughPut: number function
	isActive: boolean function
	isAutoRelaseAllowed: boolean
	send: boolean
		true: changes order delivery status to DELIVERD
		false: order delivery status status not changed but order status can change
		exception- will cancel order checkout process
	pickuplocationbyId
	pickupLocations
log(message, options)



DeliveryPricingAdapter: BasePricingAdapter<DeliveryPricingAdapterContext,DeliveryPricingCalculation>
 – used to calculate cost of delivery

- key: string
- label: string
- version: string
- orderIndex: string
- isActiveFor:  function
- actions: functions that returns
		discountPrices(discountId: string): Array<PriceDiscount> number
		discountSum(discountId: string): void
		addDiscount({amount, isTaxable, isNetPrice, discountId, meta}): void
		getDiscountRows
		calculate() returns calculated delivery price
		resultSheet: returns priceSheet




# Enrollment



EnrollmentAdapter

isActiveFor: function returns boolean
transformOrderItemToEnrollmentPlan(item)  creates a subscription from order items
actions: functions that returns object with the following properties
		- configurationError: string (Currently Not implemented) it denoting a certain configuration error
		- isOverDue: Boolean sets the logic when a subscription end time is due
		- isValidForActivation: Boolean sets the logic when a subscription can be activated
		- nextPeriod: return a timestamp value denoting the next subscription period
		- shouldTriggerAction: Not implemented at the  moment but is used to trigger a different action, like and a work to a work queue based on certain logic
 logs(message, options)


enrollment Errors enum EnrollmentError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}


	





# Filters
filter adapter is executed on each filter operation and there can be multiple filter adapters configured for a single project and they all run one after the other based on the orderIndex value of the adapter
FilterAdapter: IFilterAdapter
- key: string
- label: string
- version: string
- orderIndex: string

actions: function that returns an  with properties
	- aggregateProductIds (productIds): returns array of product ids 
	- searchProducts ({productIds}) called when product is searched and is passes an product ids that matched the search case on filters with higher orderIndex should return array of productIds or an empty array if no matching product is found
	- searchAssortments ({assortmentIds}) called when assortments are searched and is passed all the matched assortmentIds from previous filters with higher orderIndex should return array of assortmentIds or an empty array if no matching assortment is found
	- transformSortStage(lastStage: {sort: {}}): used to modify sort option of a filter operation
	- transformProductSelector(lastSelector) used to filter the products that should be selected based on properties that should satisfy a given bushiness rule
	- transformFilterSelector(lastSelector) used to filter the filters that should be selected based on properties that should satisfy a given bushiness rule

	logs

export enum FilterError {
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

## Order


### OrderDiscountAdapter : IDiscountAdapter

key
label
version
orderIndex

isManualAdditionAllowed(): Boolean - controls if wether can add a discount manually or is discount only applied based on other triggers
isManualRemovalAllowed(): Boolean - controls if wether can remove a discount manually or is discount only removed based on other triggers
actions() returns object with the following properties
	-	idValidForSystemTrigger(): boolean return true if a discount is valid to be part of the order without input of a user. that could be a time based global discount like a 10% discount day if you return false, this discount will get removed from the order before any price calculation takes place.
	- reserve(): Object  return an arbitrary JSON serializable object with reservation data  this method is called when a discount is added through a manual code and let's you manually deduct expendable discounts (coupon balances for ex.) before checkout
	-release(): boolean return void, allows you to free up any reservations in backend systems
	- isValidForCodeTriggering(): boolean return true if a discount is valid to be part of the order. if you return false, this discount will get removed from the order before any price calculation takes place.
	- discountForPricingAdapterKey(): Object returns the appropriate discount context for a calculation adapter

log(message: string, options)


### OrderPricingAdapter: IPricingAdapter<OrderPricingAdapterContext, OrderPricingCalculation, IPricingSheet>
  key,
  label,
  version,
  orderIndex: 0,

  isActivatedFor(context: PricingAdapterContext):Boolean indicated if a price is going to be applied for a certain order context or not
  actions(params): Object returns an IPricingAdapterContext object 
	- calculate() Array<Calculation> return the final order price after tax, discount, delivery etc... is applied
	- getCalculation() Array<Calculation> returns all the price values included in price calculation
	- getContext(): PricingAdapterContext returns current order context
	- resultSheet()
  log(message: string, options)



defines how every price is calculated to order including tax, discount, delivery, 
### OrderPriceSheet: IOrderPricingSheet 
    calculation: array<Calculation>,
    currency,
    quantity

	- getRawPriceSheet(): Array<Calculation> returns array of all the variables for current order price calculation
	- isValid(): Boolean returns true id a order has at least one valid calculation item by default, but can be changed to be based on other logic
	- sub(filter: filterFunction): number calculated the current order price, if a filter function s passed it will be used to filter the Calculation object in the current order context
	- taxSum(): number defines how tax should be applied 
	- gross(): number gets the sum of all calculation items
	- net(): number returns net price of an order after tax is deducted from gross price
	- total({category: CalculationCategory, useNetPrice: boolean }): Currency returns the final price net or gross based on the argument given
	- filterBy(filter: Object): Array<Calculation> returns calculations remaining after applying the filter. filter is a key value pair of the fields representing calculation types that should be filtered 
	- resetCalculation(): OrderPriceSheet resets all order calculation items amount to non positive number hence invalidating them
	- addItems({amount, meta}): adds calculation items for item category to be included in price calculation
	- addDiscount({amount, discountId, meta}): Add discount Calculation category item to be included in order price calculation
	- addTax({amount, meta}) adds tax Calculation category item to be included in final order price calculation
	- addDelivery({amount, meta}): Add delivery Calculation category item to be included as a delivery in order price
	- addPayment({amount, meta}): Add payment Calculation category item to be included in final order price
	- gross(): number returns gross price of an order, tax is included in order price calculation  2 times
	- taxSum() returns the sum or TAXES OrderPriceRowCategory in price sheet calculation
	- itemsSum(): returns sum of Items OrderPriceRowCategory in price sheet calculation
	- discountSum(): returns sum of Discounts items ina price sheet calculation for a given discount ID
	- discountPrices(): returns all the discount prices applied to an order for a given discount ID
	- getDiscountRows(): Array<Calculation>: returns all the discount Calculation items found on the current order price sheet
	- getItemRows(): returns all the ITEMS calculation items found on the current order price sheet
	- getTaxRows(): returns all the TAXES calculation items found on the current order price sheet
	- getDeliveryRow(): returns all the DELIVERY calculation items found on the current order price sheet
	- getPaymentRows(): returns all the PAYMENT calculation items found on the current order price sheet







