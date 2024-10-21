---
id: interfaces
title: Interfaces
slug: interfaces
---

## OrderDelivery



<p style={{ marginBottom: "0.4em" }}><strong>Implemented by</strong></p>

- [OrderDeliveryPickUp](/api/objects#orderdeliverypickup)
- [OrderDeliveryShipping](/api/objects#orderdeliveryshipping)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
provider<br />
<a href="/api/objects#deliveryprovider"><code>DeliveryProvider</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#orderdeliverystatus"><code>OrderDeliveryStatus</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
delivered<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
fee<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
discounts<br />
<a href="/api/objects#orderdeliverydiscount"><code>[OrderDeliveryDiscount!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderDiscountable



<p style={{ marginBottom: "0.4em" }}><strong>Implemented by</strong></p>

- [OrderGlobalDiscount](/api/objects#orderglobaldiscount)
- [OrderPaymentDiscount](/api/objects#orderpaymentdiscount)
- [OrderDeliveryDiscount](/api/objects#orderdeliverydiscount)
- [OrderItemDiscount](/api/objects#orderitemdiscount)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
orderDiscount<br />
<a href="/api/objects#orderdiscount"><code>OrderDiscount!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
total<br />
<a href="/api/objects#price"><code>Price!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderPayment



<p style={{ marginBottom: "0.4em" }}><strong>Implemented by</strong></p>

- [OrderPaymentInvoice](/api/objects#orderpaymentinvoice)
- [OrderPaymentCard](/api/objects#orderpaymentcard)
- [OrderPaymentGeneric](/api/objects#orderpaymentgeneric)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
provider<br />
<a href="/api/objects#paymentprovider"><code>PaymentProvider</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#orderpaymentstatus"><code>OrderPaymentStatus</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
fee<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paid<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
discounts<br />
<a href="/api/objects#orderpaymentdiscount"><code>[OrderPaymentDiscount!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Product

Abstract Product

<p style={{ marginBottom: "0.4em" }}><strong>Implemented by</strong></p>

- [ConfigurableProduct](/api/objects#configurableproduct)
- [SimpleProduct](/api/objects#simpleproduct)
- [BundleProduct](/api/objects#bundleproduct)
- [PlanProduct](/api/objects#planproduct)
- [TokenizedProduct](/api/objects#tokenizedproduct)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_id<br />
<a href="/api/scalars#id"><code>ID!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sequence<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#productstatus"><code>ProductStatus!</code></a>
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
created<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
updated<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
published<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/api/objects#producttexts"><code>ProductTexts</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
forceLocale<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

</td>
</tr>
<tr>
<td>
media<br />
<a href="/api/objects#productmedia"><code>[ProductMedia!]!</code></a>
</td>
<td>


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
tags<br />
<a href="/api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

</td>
</tr>
<tr>
<td>
reviews<br />
<a href="/api/objects#productreview"><code>[ProductReview!]!</code></a>
</td>
<td>


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

</td>
</tr>
<tr>
<td>
reviewsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>


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

</td>
</tr>
<tr>
<td>
assortmentPaths<br />
<a href="/api/objects#productassortmentpath"><code>[ProductAssortmentPath!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
siblings<br />
<a href="/api/interfaces#product"><code>[Product!]!</code></a>
</td>
<td>


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
</tbody>
</table>

</td>
</tr>
</tbody>
</table>

