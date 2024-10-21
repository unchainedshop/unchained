---
id: queries
title: Queries
slug: queries
---

## activeWorkTypes

**Type:** [[WorkType!]!](/api/enums#worktype)

Get List of currently registered worker plugins

## assortment

**Type:** [Assortment](/api/objects#assortment)

Get a specific assortment by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
slug<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## assortments

**Type:** [[Assortment!]!](/api/objects#assortment)

Get all root assortments, by default sorted by sequence (ascending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tags<br />
<a href="/api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
slugs<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeLeaves<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## assortmentsCount

**Type:** [Int!](/api/scalars#int)

Returns total number of assortments that match a given criteria or all if no criteria is given

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
tags<br />
<a href="/api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
slugs<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeLeaves<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## countries

**Type:** [[Country!]!](/api/objects#country)

Get all countries, by default sorted by creation date (ascending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## countriesCount

**Type:** [Int!](/api/scalars#int)

Returns total number of countries

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## country

**Type:** [Country](/api/objects#country)

Get a specific country by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
countryId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## currencies

**Type:** [[Currency!]!](/api/objects#currency)

Get all currencies, by default sorted by creation date (ascending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## currenciesCount

**Type:** [Int!](/api/scalars#int)

Returns total number of currencies

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## currency

**Type:** [Currency](/api/objects#currency)

Get a specific currency by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currencyId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deliveryInterfaces

**Type:** [[DeliveryInterface!]!](/api/objects#deliveryinterface)

Get all delivery interfaces filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#deliveryprovidertype"><code>DeliveryProviderType!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deliveryProvider

**Type:** [DeliveryProvider](/api/objects#deliveryprovider)

Get a specific delivery provider by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
deliveryProviderId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deliveryProviders

**Type:** [[DeliveryProvider!]!](/api/objects#deliveryprovider)

Get all delivery providers, optionally filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#deliveryprovidertype"><code>DeliveryProviderType</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## deliveryProvidersCount

**Type:** [Int!](/api/scalars#int)

Returns total number of delivery providers, optionally filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#deliveryprovidertype"><code>DeliveryProviderType</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## enrollment

**Type:** [Enrollment](/api/objects#enrollment)

Get a specific quotation by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
enrollmentId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## enrollments

**Type:** [[Enrollment!]!](/api/objects#enrollment)

Get all enrollments, by default sorted by creation date (ascending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## enrollmentsCount

**Type:** [Int!](/api/scalars#int)

Returns total number of enrollments

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## event

**Type:** [Event](/api/objects#event)

Get a specific work unit by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
eventId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## events

**Type:** [[Event!]!](/api/objects#event)

Get all emitted events, by default sorted by creation date (desc)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
types<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
created<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## eventsCount

**Type:** [Int!](/api/scalars#int)

Get total count of all emitted events

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
types<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
created<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## eventStatistics

**Type:** [[EventStatistics!]!](/api/objects#eventstatistics)

Returns aggregated report of all the events that occurred in the system

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
types<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
from<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
to<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## filter

**Type:** [Filter](/api/objects#filter)

Get a specific filter by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filterId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## filters

**Type:** [[Filter!]!](/api/objects#filter)

Get all filters, by default sorted by creation date (ascending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## filtersCount

**Type:** [Int!](/api/scalars#int)

Returns total number of filters

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## impersonator

**Type:** [User](/api/objects#user)

User impersonating current user session using the  impersonate API

## language

**Type:** [Language](/api/objects#language)

Get a specific language

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
languageId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## languages

**Type:** [[Language]!](/api/objects#language)

Get all languages, by default sorted by creation date (ascending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## languagesCount

**Type:** [Int!](/api/scalars#int)

Returns total number languages

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## me

**Type:** [User](/api/objects#user)

Currently logged in user

## order

**Type:** [Order](/api/objects#order)

Get a specific single order

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## orders

**Type:** [[Order!]!](/api/objects#order)

Get all orders, by default sorted by creation date (descending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeCarts<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#orderstatus"><code>[OrderStatus!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ordersCount

**Type:** [Int!](/api/scalars#int)

Returns total number of orders

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
includeCarts<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## orderStatistics

**Type:** [OrderStatistics!](/api/objects#orderstatistics)

Returns aggregated report of all the orders that occurred in the system

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
from<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
to<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## paymentInterfaces

**Type:** [[PaymentInterface!]!](/api/objects#paymentinterface)

Get all payment interfaces filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#paymentprovidertype"><code>PaymentProviderType!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## paymentProvider

**Type:** [PaymentProvider](/api/objects#paymentprovider)

Get a specific payment provider by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
paymentProviderId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## paymentProviders

**Type:** [[PaymentProvider!]!](/api/objects#paymentprovider)

Get all payment providers, optionally filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#paymentprovidertype"><code>PaymentProviderType</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## paymentProvidersCount

**Type:** [Int!](/api/scalars#int)

Returns total number of payment providers, optionally filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#paymentprovidertype"><code>PaymentProviderType</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## product

**Type:** [Product](/api/interfaces#product)

Get a specific product by id or slug

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
slug<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## productCatalogPrices

**Type:** [[ProductCatalogPrice!]!](/api/objects#productcatalogprice)

List products specified prices

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## productReview

**Type:** [ProductReview!](/api/objects#productreview)

Get a specific product review by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productReviewId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## productReviews

**Type:** [[ProductReview!]!](/api/objects#productreview)

Get all product reviews, by default sorted by creation date (descending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## productReviewsCount

**Type:** [Int!](/api/scalars#int)

Returns total number of product reviews

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## products

**Type:** [[Product!]!](/api/interfaces#product)

Simple list of published products filtered either by tags or explicit slugs
If a slug is provided, limit and offset don't have any effect on the result
By default sorted by sequence (ascending) and published (ascending) unless a queryString is set

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tags<br />
<a href="/api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
slugs<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeDrafts<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## productsCount

**Type:** [Int!](/api/scalars#int)

Return total number of published products filtered either by tags or explicit slugs
If a slug is provided

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
tags<br />
<a href="/api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
slugs<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeDrafts<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## quotation

**Type:** [Quotation](/api/objects#quotation)

Get a specific quotation by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quotationId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## quotations

**Type:** [[Quotation!]!](/api/objects#quotation)

Get all quotations, by default sorted by creation date (ascending)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## quotationsCount

**Type:** [Int!](/api/scalars#int)

Returns total number of quotations

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## searchAssortments

**Type:** [AssortmentSearchResult!](/api/objects#assortmentsearchresult)

Search assortments

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
assortmentIds<br />
<a href="/api/scalars#id"><code>[ID!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
orderBy<br />
<a href="/api/enums#searchorderby"><code>SearchOrderBy</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## searchProducts

**Type:** [ProductSearchResult!](/api/objects#productsearchresult)

Search products

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filterQuery<br />
<a href="/api/inputObjects#filterqueryinput"><code>[FilterQueryInput!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
assortmentId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
orderBy<br />
<a href="/api/enums#searchorderby"><code>SearchOrderBy</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeInactive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
ignoreChildAssortments<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## shopInfo

**Type:** [Shop!](/api/objects#shop)

Get shop-global data and the resolved country/language pair

## token

**Type:** [Token](/api/objects#token)

Get token

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
tokenId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## tokens

**Type:** [[Token!]!](/api/objects#token)

Get all tokens

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## translatedAssortmentMediaTexts

**Type:** [[AssortmentMediaTexts!]!](/api/objects#assortmentmediatexts)

Localization: Media title/subtitle of a media that is attached to a assortment

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentMediaId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## translatedAssortmentTexts

**Type:** [[AssortmentTexts!]!](/api/objects#assortmenttexts)

Localization: Meta data for assortments

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## translatedFilterTexts

**Type:** [[FilterTexts!]!](/api/objects#filtertexts)

Localization: Filters and Filter Options

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filterId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filterOptionValue<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## translatedProductMediaTexts

**Type:** [[ProductMediaTexts!]!](/api/objects#productmediatexts)

Localization: Media title/subtitle of a media that is attached to a product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productMediaId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## translatedProductTexts

**Type:** [[ProductTexts!]!](/api/objects#producttexts)

Localization: Meta data for product

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## translatedProductVariationTexts

**Type:** [[ProductVariationTexts!]!](/api/objects#productvariationtexts)

Localization: Variations and Variation Options

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productVariationId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
productVariationOptionValue<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## user

**Type:** [User](/api/objects#user)

Specific user data if userId provided, else returns currently logged in

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
userId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## users

**Type:** [[User!]!](/api/objects#user)

Get list of users, by default sorted by creation date (ascending) unless a queryString is set

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
includeGuests<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## usersCount

**Type:** [Int!](/api/scalars#int)

Get total number of users in the system that match query

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
includeGuests<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## validateResetPasswordToken

**Type:** [Boolean!](/api/scalars#boolean)

Determines if a token is valid/active for reset password

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
token<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## validateVerifyEmailToken

**Type:** [Boolean!](/api/scalars#boolean)

Determines if a token is valid/active for email verification

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
token<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## warehousingInterfaces

**Type:** [[WarehousingInterface!]!](/api/objects#warehousinginterface)

Get all warehousing interfaces filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#warehousingprovidertype"><code>WarehousingProviderType!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## warehousingProvider

**Type:** [WarehousingProvider](/api/objects#warehousingprovider)

Get a specific warehousing provider by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
warehousingProviderId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## warehousingProviders

**Type:** [[WarehousingProvider!]!](/api/objects#warehousingprovider)

Get all warehousing providers, optionally filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#warehousingprovidertype"><code>WarehousingProviderType</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## warehousingProvidersCount

**Type:** [Int!](/api/scalars#int)

Returns total number of delivery providers, optionally filtered by type

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#warehousingprovidertype"><code>WarehousingProviderType</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## work

**Type:** [Work](/api/objects#work)

Get a specific work unit by ID

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
workId<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## workQueue

**Type:** [[Work!]!](/api/objects#work)

Get all work from the queue, by default sorted by start date (desc), priority (desc), originalWorkId (asc) and created (asc)

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
limit<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
offset<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#workstatus"><code>[WorkStatus!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
created<br />
<a href="/api/inputObjects#datefilterinput"><code>DateFilterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sort<br />
<a href="/api/inputObjects#sortoptioninput"><code>[SortOptionInput!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
types<br />
<a href="/api/enums#worktype"><code>[WorkType!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## workQueueCount

**Type:** [Int!](/api/scalars#int)

Return total number of workers filtered the provided arguments

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
status<br />
<a href="/api/enums#workstatus"><code>[WorkStatus!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
types<br />
<a href="/api/enums#worktype"><code>[WorkType!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
created<br />
<a href="/api/inputObjects#datefilterinput"><code>DateFilterInput</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
queryString<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## workStatistics

**Type:** [[WorkStatistics!]!](/api/objects#workstatistics)

Returns aggregated report of all the worker jobs that occurred in the system

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
types<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
from<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
to<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

