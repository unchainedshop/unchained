---
id: mutations
title: Mutations
slug: mutations
---

## activateEnrollment

**Type:** [Enrollment!](/../api/objects#enrollment)

Activate a enrollment by changing the status to ACTIVE

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
enrollmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addAssortmentFilter

**Type:** [AssortmentFilter!](/../api/objects#assortmentfilter)

Add a new filter to an assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filterId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tags<br />
<a href="/../api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addAssortmentLink

**Type:** [AssortmentLink!](/../api/objects#assortmentlink)

Add a new child assortment to an assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
parentAssortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
childAssortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tags<br />
<a href="/../api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addAssortmentMedia

**Type:** [AssortmentMedia!](/../api/objects#assortmentmedia)

Add a new media to a assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
media<br />
<a href="/../api/scalars#upload"><code>Upload!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addAssortmentProduct

**Type:** [AssortmentProduct!](/../api/objects#assortmentproduct)

Add a new product to an assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tags<br />
<a href="/../api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addCartDiscount

**Type:** [OrderDiscount!](/../api/objects#orderdiscount)

Add a new discount to the cart, a new order gets generated with status = open (= order before checkout / cart) if necessary

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
code<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addCartProduct

**Type:** [OrderItem!](/../api/objects#orderitem)

Add a new item to the cart. Order gets generated with status = open (= order before checkout / cart) if necessary.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/../api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/../api/inputObjects#productconfigurationparameterinput"><code>[ProductConfigurationParameterInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addCartQuotation

**Type:** [OrderItem!](/../api/objects#orderitem)

Add a new quotation to the cart.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quotationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/../api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/../api/inputObjects#productconfigurationparameterinput"><code>[ProductConfigurationParameterInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addEmail

**Type:** [User!](/../api/objects#user)

Update E-Mail address of any user or logged in user if userId is not provided

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addMultipleCartProducts

**Type:** [[OrderItem]!](/../api/objects#orderitem)

Add multiple new item to the cart. Order gets generated with status = open (= order before checkout / cart) if necessary.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
items<br />
<a href="/../api/inputObjects#orderiteminput"><code>[OrderItemInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addProductAssignment

**Type:** [Product!](/../api/interfaces#product)

Link a new product to a ConfigurableProduct by providing a configuration
combination that uniquely identifies a row in the assignment matrix

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
proxyId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
vectors<br />
<a href="/../api/inputObjects#productassignmentvectorinput"><code>[ProductAssignmentVectorInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addProductMedia

**Type:** [ProductMedia!](/../api/objects#productmedia)

Add a new media to a product's visualization

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
media<br />
<a href="/../api/scalars#upload"><code>Upload!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addProductReviewVote

**Type:** [ProductReview!](/../api/objects#productreview)

Add a vote to a ProductReview.
If there there is a previous vote from the user invoking this it will be removed and updated with the new vote

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productReviewId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/../api/enums#productreviewvotetype"><code>ProductReviewVoteType!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addPushSubscription

**Type:** [User!](/../api/objects#user)

Store user W3C Push subscription object

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
subscription<br />
<a href="/../api/scalars#json"><code>JSON!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
unsubscribeFromOtherUsers<br />
<a href="/../api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addWeb3Address

**Type:** [User!](/../api/objects#user)

Web3

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addWebAuthnCredentials

**Type:** [User!](/../api/objects#user)

Register WebAuthn Credentials for current user

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
credentials<br />
<a href="/../api/scalars#json"><code>JSON!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## addWork

**Type:** [Work](/../api/objects#work)

Add work to the work queue. Each type has its own input shape. If you pinpoint the worker by setting it
during creation, the work will be only run by the worker who identifies as that worker.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/../api/enums#worktype"><code>WorkType!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
priority<br />
<a href="/../api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
originalWorkId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
scheduled<br />
<a href="/../api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
retries<br />
<a href="/../api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
worker<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## allocateWork

**Type:** [Work](/../api/objects#work)

Get the next task from the worker queue. This will also mark the task as "started".
Optional worker to identify the worker.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
types<br />
<a href="/../api/enums#worktype"><code>[WorkType]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
worker<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## bookmark

**Type:** [Bookmark!](/../api/objects#bookmark)

Toggle Bookmark state on a product as currently logged in user,
Does not work when multiple bookmarks with different explicit meta configurations exist.
In those cases please use createBookmark and removeBookmark

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
bookmarked<br />
<a href="/../api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## buildSecretTOTPAuthURL

**Type:** [String!](/../api/scalars#string)

In order to activate TOTP, generate a secret and return

## changePassword

**Type:** [SuccessResponse](/../api/objects#successresponse)

Change the current user's password. Must be logged in.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
oldPlainPassword<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
newPlainPassword<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## checkoutCart

**Type:** [Order!](/../api/objects#order)

Process the checkout (automatically charge & deliver if possible), the cart will get
transformed to an ordinary order if everything goes well.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
deliveryContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## confirmMediaUpload

**Type:** [Media!](/../api/objects#media)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
mediaUploadTicketId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
size<br />
<a href="/../api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## confirmOrder

**Type:** [Order!](/../api/objects#order)

Manually confirm an order which is in progress

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
deliveryContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
comment<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createAssortment

**Type:** [Assortment!](/../api/objects#assortment)

Creates new assortment.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortment<br />
<a href="/../api/inputObjects#createassortmentinput"><code>CreateAssortmentInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createBookmark

**Type:** [Bookmark!](/../api/objects#bookmark)

Create a bookmark for a specific user

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createCart

**Type:** [Order!](/../api/objects#order)

Creates an alternative cart. If you use this feature, you should use explicit orderId's when using the
cart mutations. Else it will work like a stack and the checkout will use the very first cart of the user.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderNumber<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createCountry

**Type:** [Country!](/../api/objects#country)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
country<br />
<a href="/../api/inputObjects#createcountryinput"><code>CreateCountryInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createCurrency

**Type:** [Currency!](/../api/objects#currency)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
<a href="/../api/inputObjects#createcurrencyinput"><code>CreateCurrencyInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createDeliveryProvider

**Type:** [DeliveryProvider!](/../api/objects#deliveryprovider)

Creates new delivery provider

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
deliveryProvider<br />
<a href="/../api/inputObjects#createdeliveryproviderinput"><code>CreateDeliveryProviderInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createEnrollment

**Type:** [Enrollment!](/../api/objects#enrollment)

Create a enrollment.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
plan<br />
<a href="/../api/inputObjects#enrollmentplaninput"><code>EnrollmentPlanInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
billingAddress<br />
<a href="/../api/inputObjects#addressinput"><code>AddressInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contact<br />
<a href="/../api/inputObjects#contactinput"><code>ContactInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
payment<br />
<a href="/../api/inputObjects#enrollmentpaymentinput"><code>EnrollmentPaymentInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
delivery<br />
<a href="/../api/inputObjects#enrollmentdeliveryinput"><code>EnrollmentDeliveryInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createFilter

**Type:** [Filter!](/../api/objects#filter)

Creates new Filter along with the user who created it.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filter<br />
<a href="/../api/inputObjects#createfilterinput"><code>CreateFilterInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createFilterOption

**Type:** [Filter!](/../api/objects#filter)

Adds new option to filters

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filterId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
option<br />
<a href="/../api/inputObjects#createfilteroptioninput"><code>CreateFilterOptionInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createLanguage

**Type:** [Language!](/../api/objects#language)

Adds new language along with the user who created it

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
language<br />
<a href="/../api/inputObjects#createlanguageinput"><code>CreateLanguageInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createPaymentProvider

**Type:** [PaymentProvider!](/../api/objects#paymentprovider)

Adds new payment provider

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
paymentProvider<br />
<a href="/../api/inputObjects#createpaymentproviderinput"><code>CreatePaymentProviderInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createProduct

**Type:** [Product!](/../api/interfaces#product)

Create a new product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
product<br />
<a href="/../api/inputObjects#createproductinput"><code>CreateProductInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createProductBundleItem

**Type:** [Product!](/../api/interfaces#product)

Adds one product as bundle for another products

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
item<br />
<a href="/../api/inputObjects#createproductbundleiteminput"><code>CreateProductBundleItemInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createProductReview

**Type:** [ProductReview!](/../api/objects#productreview)

Add a new ProductReview

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productReview<br />
<a href="/../api/inputObjects#productreviewinput"><code>ProductReviewInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createProductVariation

**Type:** [ProductVariation!](/../api/objects#productvariation)

Creates new product variation for a product.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
variation<br />
<a href="/../api/inputObjects#createproductvariationinput"><code>CreateProductVariationInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createProductVariationOption

**Type:** [ProductVariation!](/../api/objects#productvariation)

Adds variation option to an existing product variations

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productVariationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
option<br />
<a href="/../api/inputObjects#createproductvariationoptioninput"><code>CreateProductVariationOptionInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createUser

**Type:** [LoginMethodResponse](/../api/objects#loginmethodresponse)

Create a new user.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
username<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
email<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
webAuthnPublicKeyCredentials<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
plainPassword<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
profile<br />
<a href="/../api/inputObjects#userprofileinput"><code>UserProfileInput</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createWarehousingProvider

**Type:** [WarehousingProvider!](/../api/objects#warehousingprovider)

Creates new warehouse provider.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
warehousingProvider<br />
<a href="/../api/inputObjects#createwarehousingproviderinput"><code>CreateWarehousingProviderInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createWebAuthnCredentialCreationOptions

**Type:** [JSON!](/../api/scalars#json)

Create WebAuthn PublicKeyCredentialCreationOptions to use for Registering a new WebAuthn Device

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
username<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
extensionOptions<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## createWebAuthnCredentialRequestOptions

**Type:** [JSON!](/../api/scalars#json)

Create WebAuthn PublicKeyCredentialRequestrOptions to use for WebAuthn Login Flow

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
username<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
extensionOptions<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deliverOrder

**Type:** [Order!](/../api/objects#order)

Manually mark a undelivered order as delivered

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## disableTOTP

**Type:** [User!](/../api/objects#user)

Disable the 2nd factor (TOTP)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
code<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## emptyCart

**Type:** [Order](/../api/objects#order)

Remove all items of an open order (cart) if possible.
if you want to remove single cart item use removeCartItem instead

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## enableTOTP

**Type:** [User!](/../api/objects#user)

In order to activate 2nd factor (TOTP), generate a secret and return

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
secretBase32<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
code<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## enrollUser

**Type:** [User!](/../api/objects#user)

Enroll a new user, setting enroll to true will let the user choose his password (e-mail gets sent)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
profile<br />
<a href="/../api/inputObjects#userprofileinput"><code>UserProfileInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
email<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
plainPassword<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## exportToken

**Type:** [Token!](/../api/objects#token)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
tokenId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/../api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
recipientWalletAddress<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## finishWork

**Type:** [Work!](/../api/objects#work)

Register a work attempt manually.
Note: Usually, work attempts are handled internally by the inbuilt cron
worker. This mutation is part of the interface for "outside" workers.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
workId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
result<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
error<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
success<br />
<a href="/../api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
worker<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
started<br />
<a href="/../api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
finished<br />
<a href="/../api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## forgotPassword

**Type:** [SuccessResponse](/../api/objects#successresponse)

Request a forgot password email.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## heartbeat

**Type:** [User!](/../api/objects#user)

Update hearbeat (updates user activity information such as last
login and logged in user IP address, locale and country where they
accessed the system)

## impersonate

**Type:** [LoginMethodResponse!](/../api/objects#loginmethodresponse)

Impersonate a user

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## invalidateToken

**Type:** [Token!](/../api/objects#token)

Tokenize

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
tokenId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## linkOAuthAccount

**Type:** [User!](/../api/objects#user)

OAuth2

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
provider<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
authorizationCode<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
redirectUrl<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## loginAsGuest

**Type:** [LoginMethodResponse](/../api/objects#loginmethodresponse)

Login as Guest User (creates an anonymous user and returns logged in token)

## loginWithOAuth

**Type:** [LoginMethodResponse](/../api/objects#loginmethodresponse)

Log the user with OAuth2 service provider

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
provider<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
authorizationCode<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
redirectUrl<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## loginWithPassword

**Type:** [LoginMethodResponse](/../api/objects#loginmethodresponse)

Log the user in with a password.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
username<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
email<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
plainPassword<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
totpCode<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## loginWithWebAuthn

**Type:** [LoginMethodResponse](/../api/objects#loginmethodresponse)

Log the user in with a WebAuthn device

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
webAuthnPublicKeyCredentials<br />
<a href="/../api/scalars#json"><code>JSON!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## logout

**Type:** [SuccessResponse](/../api/objects#successresponse)

Log the user out.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
token<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## logoutAllSessions

**Type:** [SuccessResponse](/../api/objects#successresponse)

Log out all sessions related with user.

## makeQuotationProposal

**Type:** [Quotation!](/../api/objects#quotation)

Make a proposal as answer to the RFP by changing its status to PROCESSED

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quotationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quotationContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## markPaymentCredentialsPreferred

**Type:** [PaymentCredentials](/../api/objects#paymentcredentials)

Make's the provided payment credential as the users preferred method of payment.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
paymentCredentialsId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## pageView

**Type:** [String!](/../api/scalars#string)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
path<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
referrer<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## payOrder

**Type:** [Order!](/../api/objects#order)

Manually mark an unpaid/partially paid order as fully paid

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## prepareAssortmentMediaUpload

**Type:** [MediaUploadTicket!](/../api/objects#mediauploadticket)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
mediaName<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
assortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## prepareProductMediaUpload

**Type:** [MediaUploadTicket!](/../api/objects#mediauploadticket)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
mediaName<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## prepareUserAvatarUpload

**Type:** [MediaUploadTicket!](/../api/objects#mediauploadticket)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
mediaName<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## processNextWork

**Type:** [Work](/../api/objects#work)

This will pick up non-external work, execute, await result and finish
it up on the target system. This function allows you to do work queue "ticks"
from outside instead of waiting for default Cron and Event Listener to trigger
and can be helpful in serverless environments.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
worker<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## publishProduct

**Type:** [Product!](/../api/interfaces#product)

Make the product visible on any shop listings (product queries)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## registerPaymentCredentials

**Type:** [PaymentCredentials](/../api/objects#paymentcredentials)

Register credentials for an existing payment provider allowing to store and use them
for later payments (1-click checkout or enrollments)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
transactionContext<br />
<a href="/../api/scalars#json"><code>JSON!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## rejectOrder

**Type:** [Order!](/../api/objects#order)

Manually reject an order which is in progress

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
deliveryContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
comment<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## rejectQuotation

**Type:** [Quotation!](/../api/objects#quotation)

Reject an RFP, this is possible as long as a quotation is not fullfilled

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quotationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quotationContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeAssortment

**Type:** [Assortment!](/../api/objects#assortment)

Removes assortment with the provided ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeAssortmentFilter

**Type:** [AssortmentFilter!](/../api/objects#assortmentfilter)

Remove a product from an assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentFilterId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeAssortmentLink

**Type:** [AssortmentLink!](/../api/objects#assortmentlink)

Remove a child/parent assortment link from it's parent

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentLinkId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeAssortmentMedia

**Type:** [AssortmentMedia!](/../api/objects#assortmentmedia)

Remove a media asset from a assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentMediaId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeAssortmentProduct

**Type:** [AssortmentProduct!](/../api/objects#assortmentproduct)

Remove a product from an assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentProductId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeBookmark

**Type:** [Bookmark!](/../api/objects#bookmark)

Remove an existing bookmark by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
bookmarkId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeBundleItem

**Type:** [Product!](/../api/interfaces#product)

Removes products bundle item found at the given 0 based index.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
index<br />
<a href="/../api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeCartDiscount

**Type:** [OrderDiscount!](/../api/objects#orderdiscount)

Remove a discount from the cart

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
discountId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeCartItem

**Type:** [OrderItem!](/../api/objects#orderitem)

Remove an item from an open order

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
itemId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeCountry

**Type:** [Country!](/../api/objects#country)

Deletes the specified country

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
countryId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeCurrency

**Type:** [Currency!](/../api/objects#currency)

Deletes the specified currency

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currencyId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeDeliveryProvider

**Type:** [DeliveryProvider!](/../api/objects#deliveryprovider)

Deletes a delivery provider by setting the deleted field to current timestamp.
Note the delivery provider still exists.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
deliveryProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeEmail

**Type:** [User!](/../api/objects#user)

Update E-Mail address of any user or logged in user if userId is not provided

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeFilter

**Type:** [Filter!](/../api/objects#filter)

Deletes the specified filter

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filterId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeFilterOption

**Type:** [Filter!](/../api/objects#filter)

Removes the filter option from the specified filter.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filterId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filterOptionValue<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeLanguage

**Type:** [Language!](/../api/objects#language)

Deletes the specified languages

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
languageId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeOrder

**Type:** [Order!](/../api/objects#order)

Remove an order while it's still open

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removePaymentCredentials

**Type:** [PaymentCredentials](/../api/objects#paymentcredentials)

Deletes the specified payment credential.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
paymentCredentialsId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removePaymentProvider

**Type:** [PaymentProvider!](/../api/objects#paymentprovider)

Deletes the specified payment provider by setting the deleted filed to current timestamp.
Note the payment provider is still available only it’s status is deleted

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
paymentProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeProduct

**Type:** [Product!](/../api/interfaces#product)

Remove the product completely!

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeProductAssignment

**Type:** [Product!](/../api/interfaces#product)

Unlinks a product from a ConfigurableProduct by providing a configuration
combination that uniquely identifies a row in the assignment matrix

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
proxyId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
vectors<br />
<a href="/../api/inputObjects#productassignmentvectorinput"><code>[ProductAssignmentVectorInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeProductMedia

**Type:** [ProductMedia!](/../api/objects#productmedia)

Remove a media asset from a product's visualization

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productMediaId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeProductReview

**Type:** [ProductReview!](/../api/objects#productreview)

Remove an existing ProductReview. The logic to allow/dissallow removal is controlled by product plugin logic

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productReviewId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeProductReviewVote

**Type:** [ProductReview!](/../api/objects#productreview)

Remove a vote from a ProductReview

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productReviewId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/../api/enums#productreviewvotetype"><code>ProductReviewVoteType</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeProductVariation

**Type:** [ProductVariation!](/../api/objects#productvariation)

Removes product variation with the provided ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productVariationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeProductVariationOption

**Type:** [ProductVariation!](/../api/objects#productvariation)

Removes product option value for product variation with the provided variation option value

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productVariationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productVariationOptionValue<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removePushSubscription

**Type:** [User!](/../api/objects#user)

Remove user W3C push subscription object

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
p256dh<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeUser

**Type:** [User!](/../api/objects#user)

Remove any user or logged in user if userId is not provided

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeWarehousingProvider

**Type:** [WarehousingProvider!](/../api/objects#warehousingprovider)

Deletes the specified warehousing provider by setting the deleted filed to current timestamp.
Note warehousing provider still exists in the system after successful
completing of this operation with status deleted.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
warehousingProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeWeb3Address

**Type:** [User!](/../api/objects#user)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeWebAuthnCredentials

**Type:** [User!](/../api/objects#user)

Remove WebAuthn Credentials for current user

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
credentialsId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## removeWork

**Type:** [Work!](/../api/objects#work)

Manually remove a work

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
workId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## reorderAssortmentFilters

**Type:** [[AssortmentFilter!]!](/../api/objects#assortmentfilter)

Reorder the products in an assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
sortKeys<br />
<a href="/../api/inputObjects#reorderassortmentfilterinput"><code>[ReorderAssortmentFilterInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## reorderAssortmentLinks

**Type:** [[AssortmentLink!]!](/../api/objects#assortmentlink)

Reorder the child assortment links in it's parent

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
sortKeys<br />
<a href="/../api/inputObjects#reorderassortmentlinkinput"><code>[ReorderAssortmentLinkInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## reorderAssortmentMedia

**Type:** [[AssortmentMedia!]!](/../api/objects#assortmentmedia)

Reorder a media asset (first is primary)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
sortKeys<br />
<a href="/../api/inputObjects#reorderassortmentmediainput"><code>[ReorderAssortmentMediaInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## reorderAssortmentProducts

**Type:** [[AssortmentProduct!]!](/../api/objects#assortmentproduct)

Reorder the products in an assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
sortKeys<br />
<a href="/../api/inputObjects#reorderassortmentproductinput"><code>[ReorderAssortmentProductInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## reorderProductMedia

**Type:** [[ProductMedia!]!](/../api/objects#productmedia)

Reorder a media asset (first is primary)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
sortKeys<br />
<a href="/../api/inputObjects#reorderproductmediainput"><code>[ReorderProductMediaInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## requestQuotation

**Type:** [Quotation!](/../api/objects#quotation)

Request for Proposal (RFP) for the specified product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/../api/inputObjects#productconfigurationparameterinput"><code>[ProductConfigurationParameterInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## resetPassword

**Type:** [LoginMethodResponse](/../api/objects#loginmethodresponse)

Reset the password for a user using a token received in email. Logs the user in afterwards.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
newPlainPassword<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
token<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## sendEnrollmentEmail

**Type:** [SuccessResponse](/../api/objects#successresponse)

Forcefully trigger an enrollment email for already added users by e-mail

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## sendVerificationEmail

**Type:** [SuccessResponse](/../api/objects#successresponse)

Send an email with a link the user can use verify their email address.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
email<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## setBaseAssortment

**Type:** [Assortment!](/../api/objects#assortment)

Makes the assortment provided as the base assortment and make
any other existing base assortment regular assortments.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## setOrderDeliveryProvider

**Type:** [Order!](/../api/objects#order)

Change the delivery method/provider to an order. If the delivery provider
doesn’t exists new delivery provider will be created with the provided ID.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
deliveryProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## setOrderPaymentProvider

**Type:** [Order!](/../api/objects#order)

Change the payment method/provider to an order. If the payment provider
doesn’t exists new payment provider will be created with the provided ID.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## setPassword

**Type:** [User!](/../api/objects#user)

Set a new password for a specific user

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
newPlainPassword<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## setRoles

**Type:** [User!](/../api/objects#user)

Set roles of a user

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
roles<br />
<a href="/../api/scalars#string"><code>[String!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## setUsername

**Type:** [User!](/../api/objects#user)

Set username for a specific user

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
username<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## setUserTags

**Type:** [User!](/../api/objects#user)

Set tags of user

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
tags<br />
<a href="/../api/scalars#lowercasestring"><code>[LowerCaseString]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signPaymentProviderForCheckout

**Type:** [String!](/../api/scalars#string)

Sign a generic order payment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderPaymentId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transactionContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## signPaymentProviderForCredentialRegistration

**Type:** [String](/../api/scalars#string)

Sign a generic payment provider for registration

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
paymentProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
transactionContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## stopImpersonation

**Type:** [LoginMethodResponse!](/../api/objects#loginmethodresponse)

End customer impersonated user session and resume the impersonator session

## terminateEnrollment

**Type:** [Enrollment!](/../api/objects#enrollment)

Terminate an actively running enrollment by changing it's status to TERMINATED

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
enrollmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## unlinkOAuthAccount

**Type:** [User!](/../api/objects#user)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
provider<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
oAuthAccountId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## unpublishProduct

**Type:** [Product!](/../api/interfaces#product)

Hide the product visible from any shop listings (product queries)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateAssortment

**Type:** [Assortment!](/../api/objects#assortment)

Updates the provided assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortment<br />
<a href="/../api/inputObjects#updateassortmentinput"><code>UpdateAssortmentInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
assortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateAssortmentMediaTexts

**Type:** [[AssortmentMediaTexts!]!](/../api/objects#assortmentmediatexts)

Modify localized texts part of a assortment media asset

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentMediaId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/../api/inputObjects#updateassortmentmediatextinput"><code>[UpdateAssortmentMediaTextInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateAssortmentTexts

**Type:** [[AssortmentTexts!]!](/../api/objects#assortmenttexts)

Modify localized texts part of an assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/../api/inputObjects#updateassortmenttextinput"><code>[UpdateAssortmentTextInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateCart

**Type:** [Order!](/../api/objects#order)

Change billing address and order contact of an open order (cart). All of the parameters
except order ID are optional and the update will ocure for parameters provided.
If the delivery provider or payment provider ID provided doesn’t already exist new order payment
will be created with the provided ID.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
billingAddress<br />
<a href="/../api/inputObjects#addressinput"><code>AddressInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contact<br />
<a href="/../api/inputObjects#contactinput"><code>ContactInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentProviderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
deliveryProviderId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateCartItem

**Type:** [OrderItem!](/../api/objects#orderitem)

Change the quantity or configuration of an item in an open order.align-baselineAll
of the parameters are optional except item ID and for the parameters provided the
update will be performed accordingly.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
itemId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/../api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/../api/inputObjects#productconfigurationparameterinput"><code>[ProductConfigurationParameterInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateCountry

**Type:** [Country!](/../api/objects#country)

Updates provided country information

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
country<br />
<a href="/../api/inputObjects#updatecountryinput"><code>UpdateCountryInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
countryId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateCurrency

**Type:** [Currency!](/../api/objects#currency)

Updates the specified currency

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
<a href="/../api/inputObjects#updatecurrencyinput"><code>UpdateCurrencyInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
currencyId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateDeliveryProvider

**Type:** [DeliveryProvider!](/../api/objects#deliveryprovider)

Updates the delivery provider specified

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
deliveryProvider<br />
<a href="/../api/inputObjects#updateproviderinput"><code>UpdateProviderInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
deliveryProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateEnrollment

**Type:** [Enrollment!](/../api/objects#enrollment)

Update a enrollment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
enrollmentId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
plan<br />
<a href="/../api/inputObjects#enrollmentplaninput"><code>EnrollmentPlanInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
billingAddress<br />
<a href="/../api/inputObjects#addressinput"><code>AddressInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contact<br />
<a href="/../api/inputObjects#contactinput"><code>ContactInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
payment<br />
<a href="/../api/inputObjects#enrollmentpaymentinput"><code>EnrollmentPaymentInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
delivery<br />
<a href="/../api/inputObjects#enrollmentdeliveryinput"><code>EnrollmentDeliveryInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateFilter

**Type:** [Filter!](/../api/objects#filter)

Updates the specified filter with the information passed.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filter<br />
<a href="/../api/inputObjects#updatefilterinput"><code>UpdateFilterInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filterId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateFilterTexts

**Type:** [[FilterTexts!]!](/../api/objects#filtertexts)

Updates or created specified filter texts for filter with ID provided and locale and optionally filterOptionValue

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filterId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filterOptionValue<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/../api/inputObjects#updatefiltertextinput"><code>[UpdateFilterTextInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateLanguage

**Type:** [Language!](/../api/objects#language)

Updates the specified language.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
language<br />
<a href="/../api/inputObjects#updatelanguageinput"><code>UpdateLanguageInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
languageId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateOrderDeliveryPickUp

**Type:** [OrderDeliveryPickUp!](/../api/objects#orderdeliverypickup)

Update a Pick Up Delivery Provider's specific configuration

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderDeliveryId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
orderPickUpLocationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateOrderDeliveryShipping

**Type:** [OrderDeliveryShipping!](/../api/objects#orderdeliveryshipping)

Update a Shipping Delivery Provider's specific configuration

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderDeliveryId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
address<br />
<a href="/../api/inputObjects#addressinput"><code>AddressInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateOrderPaymentCard

**Type:** [OrderPaymentCard!](/../api/objects#orderpaymentcard)

Update a Card Payment Provider's specific configuration

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderPaymentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateOrderPaymentGeneric

**Type:** [OrderPaymentGeneric!](/../api/objects#orderpaymentgeneric)

Update a Generic Payment Provider's specific configuration

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderPaymentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateOrderPaymentInvoice

**Type:** [OrderPaymentInvoice!](/../api/objects#orderpaymentinvoice)

Update an Invoice Payment Provider's specific configuration

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderPaymentId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updatePaymentProvider

**Type:** [PaymentProvider!](/../api/objects#paymentprovider)

Updates payment provider information with the provided ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
paymentProvider<br />
<a href="/../api/inputObjects#updateproviderinput"><code>UpdateProviderInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProduct

**Type:** [Product](/../api/interfaces#product)

Modify generic infos of a product (tags for ex.)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
product<br />
<a href="/../api/inputObjects#updateproductinput"><code>UpdateProductInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductCommerce

**Type:** [Product](/../api/interfaces#product)

Modify commerce part of a product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
commerce<br />
<a href="/../api/inputObjects#updateproductcommerceinput"><code>UpdateProductCommerceInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductMediaTexts

**Type:** [[ProductMediaTexts!]!](/../api/objects#productmediatexts)

Modify localized texts part of a product's media asset

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productMediaId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/../api/inputObjects#updateproductmediatextinput"><code>[UpdateProductMediaTextInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductPlan

**Type:** [Product](/../api/interfaces#product)

Modify plan part of a product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
plan<br />
<a href="/../api/inputObjects#updateproductplaninput"><code>UpdateProductPlanInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductReview

**Type:** [ProductReview!](/../api/objects#productreview)

Update an existing ProductReview. The logic to allow/dissallow editing is controlled by product plugin logic

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productReviewId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productReview<br />
<a href="/../api/inputObjects#productreviewinput"><code>ProductReviewInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductSupply

**Type:** [Product](/../api/interfaces#product)

Modify delivery part of a product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
supply<br />
<a href="/../api/inputObjects#updateproductsupplyinput"><code>UpdateProductSupplyInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductTexts

**Type:** [[ProductTexts!]!](/../api/objects#producttexts)

Modify localized texts part of a product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/../api/inputObjects#updateproducttextinput"><code>[UpdateProductTextInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductTokenization

**Type:** [TokenizedProduct](/../api/objects#tokenizedproduct)

Modify tokenization part of a product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tokenization<br />
<a href="/../api/inputObjects#updateproducttokenizationinput"><code>UpdateProductTokenizationInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductVariationTexts

**Type:** [[ProductVariationTexts!]!](/../api/objects#productvariationtexts)

Update product variation texts with the specified locales for product variations
that match the provided variation ID and production option value

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productVariationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productVariationOptionValue<br />
<a href="/../api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/../api/inputObjects#updateproductvariationtextinput"><code>[UpdateProductVariationTextInput!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateProductWarehousing

**Type:** [Product](/../api/interfaces#product)

Modify warehousing part of a product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
warehousing<br />
<a href="/../api/inputObjects#updateproductwarehousinginput"><code>UpdateProductWarehousingInput!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateUserAvatar

**Type:** [User!](/../api/objects#user)

Update Avatar of any user or logged in user if userId is not provided

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
avatar<br />
<a href="/../api/scalars#upload"><code>Upload!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateUserProfile

**Type:** [User!](/../api/objects#user)

Update Profile of any user or logged in user if userId is not provided

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
profile<br />
<a href="/../api/inputObjects#userprofileinput"><code>UserProfileInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userId<br />
<a href="/../api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## updateWarehousingProvider

**Type:** [WarehousingProvider!](/../api/objects#warehousingprovider)

Updates warehousing provider information with the provided ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
warehousingProvider<br />
<a href="/../api/inputObjects#updateproviderinput"><code>UpdateProviderInput!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
warehousingProviderId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## verifyEmail

**Type:** [LoginMethodResponse](/../api/objects#loginmethodresponse)

Marks the user's email address as verified. Logs the user in afterwards.

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
token<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## verifyQuotation

**Type:** [Quotation!](/../api/objects#quotation)

Verify quotation request elligibility. and marks requested quotations as verified if it is

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quotationId<br />
<a href="/../api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quotationContext<br />
<a href="/../api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## verifyWeb3Address

**Type:** [User!](/../api/objects#user)



<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hash<br />
<a href="/../api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

