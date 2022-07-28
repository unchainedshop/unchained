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


	



