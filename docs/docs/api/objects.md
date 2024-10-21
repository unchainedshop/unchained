---
id: objects
title: Objects
slug: objects
---

## Address



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
firstName<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
lastName<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
company<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
addressLine<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
addressLine2<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
postalCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
countryCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
regionCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
city<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## AdminUiConfig



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
customProperties<br />
<a href="/api/objects#adminuiconfigcustomentityinterface"><code>[AdminUiConfigCustomEntityInterface!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## AdminUiConfigCustomEntityInterface



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
entityName<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
inlineFragment<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Assortment

Assortment

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
deleted<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isBase<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isRoot<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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
tags<br />
<a href="/api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
media<br />
<a href="/api/objects#assortmentmedia"><code>[AssortmentMedia!]!</code></a>
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
texts<br />
<a href="/api/objects#assortmenttexts"><code>AssortmentTexts</code></a>
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
productAssignments<br />
<a href="/api/objects#assortmentproduct"><code>[AssortmentProduct!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filterAssignments<br />
<a href="/api/objects#assortmentfilter"><code>[AssortmentFilter!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
linkedAssortments<br />
<a href="/api/objects#assortmentlink"><code>[AssortmentLink!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
assortmentPaths<br />
<a href="/api/objects#assortmentpath"><code>[AssortmentPath!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
children<br />
<a href="/api/objects#assortment"><code>[Assortment!]</code></a>
</td>
<td>


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
</tbody>
</table>

</td>
</tr>
<tr>
<td>
childrenCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>


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
</tbody>
</table>

</td>
</tr>
<tr>
<td>
searchProducts<br />
<a href="/api/objects#productsearchresult"><code>ProductSearchResult!</code></a>
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
<tr>
<td>
orderBy<br />
<a href="/api/enums#searchorderby"><code>SearchOrderBy</code></a>
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

## AssortmentFilter



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
sortKey<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
assortment<br />
<a href="/api/objects#assortment"><code>Assortment!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filter<br />
<a href="/api/objects#filter"><code>Filter!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## AssortmentLink



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
sortKey<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
parent<br />
<a href="/api/objects#assortment"><code>Assortment!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
child<br />
<a href="/api/objects#assortment"><code>Assortment!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## AssortmentMedia



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
tags<br />
<a href="/api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
file<br />
<a href="/api/objects#media"><code>Media!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sortKey<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/api/objects#assortmentmediatexts"><code>AssortmentMediaTexts</code></a>
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
</tbody>
</table>

## AssortmentMediaTexts



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
locale<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
title<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
subtitle<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## AssortmentPath

Directed assortment to product paths (breadcrumbs)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
links<br />
<a href="/api/objects#assortmentpathlink"><code>[AssortmentPathLink!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## AssortmentPathLink

A connection that represents an uplink from assortment to assortment,
assortmentId and assortmentTexts are there for convenience
to short-circuit breadcrumb lookups

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

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
<tr>
<td>
assortmentTexts<br />
<a href="/api/objects#assortmenttexts"><code>AssortmentTexts!</code></a>
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
link<br />
<a href="/api/objects#assortmentlink"><code>AssortmentLink</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## AssortmentProduct



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
sortKey<br />
<a href="/api/scalars#int"><code>Int!</code></a>
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
assortment<br />
<a href="/api/objects#assortment"><code>Assortment!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
product<br />
<a href="/api/interfaces#product"><code>Product!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## AssortmentSearchResult



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
assortments<br />
<a href="/api/objects#assortment"><code>[Assortment!]!</code></a>
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
</tbody>
</table>

</td>
</tr>
</tbody>
</table>

## AssortmentTexts



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
locale<br />
<a href="/api/scalars#string"><code>String</code></a>
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
<tr>
<td>
title<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
subtitle<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
description<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Bookmark



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
user<br />
<a href="/api/objects#user"><code>User!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
product<br />
<a href="/api/interfaces#product"><code>Product!</code></a>
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

## BundleProduct

A Bundle product consists of multiple configured products

<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [Product](/api/interfaces#product)

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
bundleItems<br />
<a href="/api/objects#productbundleitem"><code>[ProductBundleItem!]</code></a>
</td>
<td>

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

## Color



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
hex<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
red<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
green<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
blue<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ConfigurableProduct

Configurable Product (Proxy)

<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [Product](/api/interfaces#product)

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
catalogPriceRange<br />
<a href="/api/objects#pricerange"><code>PriceRange</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
vectors<br />
<a href="/api/inputObjects#productassignmentvectorinput"><code>[ProductAssignmentVectorInput!]</code></a>
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
currency<br />
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
simulatedPriceRange<br />
<a href="/api/objects#pricerange"><code>PriceRange</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
vectors<br />
<a href="/api/inputObjects#productassignmentvectorinput"><code>[ProductAssignmentVectorInput!]</code></a>
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
currency<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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
products<br />
<a href="/api/interfaces#product"><code>[Product!]</code></a>
</td>
<td>
<p>Reduced list of possible products by key/value combinations</p>

<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
vectors<br />
<a href="/api/inputObjects#productassignmentvectorinput"><code>[ProductAssignmentVectorInput!]</code></a>
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
<tr>
<td>
variations<br />
<a href="/api/objects#productvariation"><code>[ProductVariation!]</code></a>
</td>
<td>
<p>Product&#39;s variations (keys) and their options (values)</p>
</td>
</tr>
<tr>
<td>
assignments<br />
<a href="/api/objects#productvariationassignment"><code>[ProductVariationAssignment!]!</code></a>
</td>
<td>
<p>Complete assignment matrix</p>

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
</tbody>
</table>

</td>
</tr>
</tbody>
</table>

## Contact



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
telNumber<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emailAddress<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ContractConfiguration



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
tokenId<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
supply<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
ercMetadataProperties<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Country



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
isoCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>ISO 3166-1 alpha-2 <a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements">https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements</a></p>
</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isBase<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
defaultCurrency<br />
<a href="/api/objects#currency"><code>Currency</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
flagEmoji<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
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
</tbody>
</table>

## Currency



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
isoCode<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contractAddress<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
decimals<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## DeliveryInterface



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
label<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
version<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## DeliveryProvider



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
deleted<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#deliveryprovidertype"><code>DeliveryProviderType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
interface<br />
<a href="/api/objects#deliveryinterface"><code>DeliveryInterface</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configurationError<br />
<a href="/api/enums#deliveryprovidererror"><code>DeliveryProviderError</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
simulatedPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
orderId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
context<br />
<a href="/api/scalars#json"><code>JSON</code></a>
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

## Dimensions



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
weight<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
unit<br />
<a href="/api/enums#massunit"><code>MassUnit</code></a>
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
length<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
unit<br />
<a href="/api/enums#lengthunit"><code>LengthUnit</code></a>
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
width<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
unit<br />
<a href="/api/enums#lengthunit"><code>LengthUnit</code></a>
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
height<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
unit<br />
<a href="/api/enums#lengthunit"><code>LengthUnit</code></a>
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

## DiscountInterface



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
label<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
version<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isManualAdditionAllowed<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isManualRemovalAllowed<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Dispatch



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
deliveryProvider<br />
<a href="/api/objects#deliveryprovider"><code>DeliveryProvider</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
warehousingProvider<br />
<a href="/api/objects#warehousingprovider"><code>WarehousingProvider</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
shipping<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
earliestDelivery<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Enrollment

Enrollment

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
billingAddress<br />
<a href="/api/objects#address"><code>Address</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api/objects#contact"><code>Contact</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
country<br />
<a href="/api/objects#country"><code>Country</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
created<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
currency<br />
<a href="/api/objects#currency"><code>Currency</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
delivery<br />
<a href="/api/objects#enrollmentdelivery"><code>EnrollmentDelivery</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
enrollmentNumber<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
expires<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isExpired<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
referenceDate<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
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
payment<br />
<a href="/api/objects#enrollmentpayment"><code>EnrollmentPayment</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
periods<br />
<a href="/api/objects#enrollmentperiod"><code>[EnrollmentPeriod!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
plan<br />
<a href="/api/objects#enrollmentplan"><code>EnrollmentPlan!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#enrollmentstatus"><code>EnrollmentStatus!</code></a>
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
user<br />
<a href="/api/objects#user"><code>User!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## EnrollmentDelivery



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
provider<br />
<a href="/api/objects#deliveryprovider"><code>DeliveryProvider</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## EnrollmentPayment



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
provider<br />
<a href="/api/objects#paymentprovider"><code>PaymentProvider</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## EnrollmentPeriod



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
start<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
end<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isTrial<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
order<br />
<a href="/api/objects#order"><code>Order</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## EnrollmentPlan



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
product<br />
<a href="/api/objects#planproduct"><code>PlanProduct!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/objects#productconfigurationparameter"><code>[ProductConfigurationParameter!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Event



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
type<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
payload<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
created<br />
<a href="/api/scalars#timestamp"><code>Timestamp!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## EventStatistics



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#eventtype"><code>EventType!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emitCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Filter



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
updated<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
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
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/api/objects#filtertexts"><code>FilterTexts</code></a>
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
type<br />
<a href="/api/enums#filtertype"><code>FilterType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
key<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
options<br />
<a href="/api/objects#filteroption"><code>[FilterOption!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## FilterOption



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
texts<br />
<a href="/api/objects#filtertexts"><code>FilterTexts</code></a>
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
value<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## FilterTexts



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
locale<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
title<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
subtitle<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## GeoPosition



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
latitude<br />
<a href="/api/scalars#float"><code>Float!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
longitude<br />
<a href="/api/scalars#float"><code>Float!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
altitute<br />
<a href="/api/scalars#float"><code>Float</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Language



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
isoCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>
<p>ISO 639-1 alpha-2 <a href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes">https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes</a></p>
</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isBase<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Link



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
href<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
title<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
target<br />
<a href="/api/enums#externallinktarget"><code>ExternalLinkTarget</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## LoadedFilter



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filteredProductsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
definition<br />
<a href="/api/objects#filter"><code>Filter!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isSelected<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
options<br />
<a href="/api/objects#loadedfilteroption"><code>[LoadedFilterOption!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## LoadedFilterOption



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
filteredProductsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
definition<br />
<a href="/api/objects#filteroption"><code>FilterOption!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isSelected<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## LoginMethodResponse

Type returned when the user logs in

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
id<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Id of the user logged in user</p>
</td>
</tr>
<tr>
<td>
token<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Token of the connection</p>
</td>
</tr>
<tr>
<td>
tokenExpires<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>
<p>Expiration date for the token</p>
</td>
</tr>
<tr>
<td>
user<br />
<a href="/api/objects#user"><code>User</code></a>
</td>
<td>
<p>The logged in user</p>
</td>
</tr>
</tbody>
</table>

## Media



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
name<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
size<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
url<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
version<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
baseUrl<br />
<a href="/api/scalars#string"><code>String</code></a>
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

## MediaUploadTicket



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
putURL<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
expires<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OAuthAccount



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
<a href="/api/objects#oauthprovider"><code>OAuthProvider!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
authorizationCode<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OAuthProvider



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
_id<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
clientId<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
scopes<br />
<a href="/api/scalars#string"><code>[String!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Order

Just an order

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
billingAddress<br />
<a href="/api/objects#address"><code>Address</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
confirmed<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
rejected<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contact<br />
<a href="/api/objects#contact"><code>Contact</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
country<br />
<a href="/api/objects#country"><code>Country</code></a>
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
currency<br />
<a href="/api/objects#currency"><code>Currency</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
delivery<br />
<a href="/api/interfaces#orderdelivery"><code>OrderDelivery</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
discounts<br />
<a href="/api/objects#orderdiscount"><code>[OrderDiscount!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
enrollment<br />
<a href="/api/objects#enrollment"><code>Enrollment</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
fullfilled<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
items<br />
<a href="/api/objects#orderitem"><code>[OrderItem!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
ordered<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
orderNumber<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
payment<br />
<a href="/api/interfaces#orderpayment"><code>OrderPayment</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#orderstatus"><code>OrderStatus</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
supportedDeliveryProviders<br />
<a href="/api/objects#deliveryprovider"><code>[DeliveryProvider!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
supportedPaymentProviders<br />
<a href="/api/objects#paymentprovider"><code>[PaymentProvider!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
total<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
category<br />
<a href="/api/enums#orderpricecategory"><code>OrderPriceCategory</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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
updated<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
user<br />
<a href="/api/objects#user"><code>User</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderDeliveryDiscount



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderDiscountable](/api/interfaces#orderdiscountable)

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
delivery<br />
<a href="/api/interfaces#orderdelivery"><code>OrderDelivery!</code></a>
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

## OrderDeliveryPickUp



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderDelivery](/api/interfaces#orderdelivery)

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
<tr>
<td>
pickUpLocations<br />
<a href="/api/objects#orderpickuplocation"><code>[OrderPickUpLocation!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
activePickUpLocation<br />
<a href="/api/objects#orderpickuplocation"><code>OrderPickUpLocation</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderDeliveryShipping



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderDelivery](/api/interfaces#orderdelivery)

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
<tr>
<td>
address<br />
<a href="/api/objects#address"><code>Address</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderDiscount



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
trigger<br />
<a href="/api/enums#orderdiscounttrigger"><code>OrderDiscountTrigger!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
code<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
order<br />
<a href="/api/objects#order"><code>Order!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
interface<br />
<a href="/api/objects#discountinterface"><code>DiscountInterface</code></a>
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


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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
discounted<br />
<a href="/api/interfaces#orderdiscountable"><code>[OrderDiscountable!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderGlobalDiscount



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderDiscountable](/api/interfaces#orderdiscountable)

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
order<br />
<a href="/api/objects#order"><code>Order!</code></a>
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

## OrderItem



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
product<br />
<a href="/api/interfaces#product"><code>Product!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
order<br />
<a href="/api/objects#order"><code>Order!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
originalProduct<br />
<a href="/api/interfaces#product"><code>Product!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quotation<br />
<a href="/api/objects#quotation"><code>Quotation</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
unitPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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
total<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
category<br />
<a href="/api/enums#orderitempricecategory"><code>OrderItemPriceCategory</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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
discounts<br />
<a href="/api/objects#orderitemdiscount"><code>[OrderItemDiscount!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
dispatches<br />
<a href="/api/objects#dispatch"><code>[Dispatch!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/objects#productconfigurationparameter"><code>[ProductConfigurationParameter!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tokens<br />
<a href="/api/objects#token"><code>[Token!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderItemDiscount



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderDiscountable](/api/interfaces#orderdiscountable)

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
item<br />
<a href="/api/objects#orderitem"><code>OrderItem!</code></a>
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

## OrderPaymentCard



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderPayment](/api/interfaces#orderpayment)

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
paid<br />
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
<a href="/api/objects#orderpaymentdiscount"><code>[OrderPaymentDiscount!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderPaymentDiscount



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderDiscountable](/api/interfaces#orderdiscountable)

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
payment<br />
<a href="/api/interfaces#orderpayment"><code>OrderPayment!</code></a>
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

## OrderPaymentGeneric



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderPayment](/api/interfaces#orderpayment)

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

## OrderPaymentInvoice



<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [OrderPayment](/api/interfaces#orderpayment)

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

## OrderPickUpLocation



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
order<br />
<a href="/api/objects#order"><code>Order!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
address<br />
<a href="/api/objects#address"><code>Address</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
geoPoint<br />
<a href="/api/objects#geoposition"><code>GeoPosition</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## OrderStatistics



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
newCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
checkoutCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
rejectCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
confirmCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
fulfillCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## PaymentCredentials



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
user<br />
<a href="/api/objects#user"><code>User!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentProvider<br />
<a href="/api/objects#paymentprovider"><code>PaymentProvider!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
token<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
meta<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isValid<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isPreferred<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## PaymentInterface



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
label<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
version<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## PaymentProvider



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
deleted<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#paymentprovidertype"><code>PaymentProviderType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
interface<br />
<a href="/api/objects#paymentinterface"><code>PaymentInterface</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configurationError<br />
<a href="/api/enums#paymentprovidererror"><code>PaymentProviderError</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
simulatedPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
orderId<br />
<a href="/api/scalars#id"><code>ID</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
context<br />
<a href="/api/scalars#json"><code>JSON</code></a>
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

## PlanProduct

Plan (Virtual Product that somebody can enroll to)

<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [Product](/api/interfaces#product)

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
catalogPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
currency<br />
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
leveledCatalogPrices<br />
<a href="/api/objects#pricelevel"><code>[PriceLevel!]!</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
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
simulatedPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/inputObjects#productconfigurationparameterinput"><code>[ProductConfigurationParameterInput!]</code></a>
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
<tr>
<td>
salesUnit<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
salesQuantityPerUnit<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
defaultOrderQuantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

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
plan<br />
<a href="/api/objects#productplanconfiguration"><code>ProductPlanConfiguration</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Price



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
isTaxable<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
amount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
currency<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## PriceLevel



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
minQuantity<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
maxQuantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
price<br />
<a href="/api/objects#price"><code>Price!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## PriceRange



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
minPrice<br />
<a href="/api/objects#price"><code>Price!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
maxPrice<br />
<a href="/api/objects#price"><code>Price!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductAssortmentPath

Directed assortment to product paths (breadcrumbs)

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
assortmentProduct<br />
<a href="/api/objects#assortmentproduct"><code>AssortmentProduct!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
links<br />
<a href="/api/objects#assortmentpathlink"><code>[AssortmentPathLink!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductBundleItem



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
product<br />
<a href="/api/interfaces#product"><code>Product!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/objects#productconfigurationparameter"><code>[ProductConfigurationParameter!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductCatalogPrice



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
isTaxable<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
country<br />
<a href="/api/objects#country"><code>Country!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
currency<br />
<a href="/api/objects#currency"><code>Currency!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
amount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
maxQuantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductConfigurationParameter



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
key<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
value<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductDiscount



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
interface<br />
<a href="/api/objects#discountinterface"><code>DiscountInterface</code></a>
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

## ProductMedia



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
tags<br />
<a href="/api/scalars#lowercasestring"><code>[LowerCaseString!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
file<br />
<a href="/api/objects#media"><code>Media!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sortKey<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
texts<br />
<a href="/api/objects#productmediatexts"><code>ProductMediaTexts</code></a>
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
</tbody>
</table>

## ProductMediaTexts



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
locale<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
title<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
subtitle<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductPlanConfiguration



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
usageCalculationType<br />
<a href="/api/enums#productplanusagecalculationtype"><code>ProductPlanUsageCalculationType!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
billingInterval<br />
<a href="/api/enums#productplanconfigurationinterval"><code>ProductPlanConfigurationInterval!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
billingIntervalCount<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
trialInterval<br />
<a href="/api/enums#productplanconfigurationinterval"><code>ProductPlanConfigurationInterval</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
trialIntervalCount<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductReview



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
deleted<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
author<br />
<a href="/api/objects#user"><code>User!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
product<br />
<a href="/api/interfaces#product"><code>Product!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
rating<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
title<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
review<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
voteCount<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#productreviewvotetype"><code>ProductReviewVoteType</code></a>
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
ownVotes<br />
<a href="/api/objects#productreviewvote"><code>[ProductReviewVote!]!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductReviewVote



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
timestamp<br />
<a href="/api/scalars#timestamp"><code>Timestamp!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#productreviewvotetype"><code>ProductReviewVoteType!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductSearchResult

Search result

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filteredProductsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filters<br />
<a href="/api/objects#loadedfilter"><code>[LoadedFilter!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
products<br />
<a href="/api/interfaces#product"><code>[Product!]!</code></a>
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
</tbody>
</table>

</td>
</tr>
</tbody>
</table>

## ProductTexts



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
locale<br />
<a href="/api/scalars#string"><code>String</code></a>
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
<tr>
<td>
title<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
subtitle<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
description<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
vendor<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
brand<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
labels<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductVariation



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
texts<br />
<a href="/api/objects#productvariationtexts"><code>ProductVariationTexts</code></a>
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
type<br />
<a href="/api/enums#productvariationtype"><code>ProductVariationType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
key<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
options<br />
<a href="/api/objects#productvariationoption"><code>[ProductVariationOption!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductVariationAssignment

Key Value Combination to Product Assignment

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
vectors<br />
<a href="/api/objects#productvariationassignmentvector"><code>[ProductVariationAssignmentVector!]</code></a>
</td>
<td>
<p>Query string key=val&amp;key=val ...</p>
</td>
</tr>
<tr>
<td>
product<br />
<a href="/api/interfaces#product"><code>Product</code></a>
</td>
<td>
<p>Assigned Product</p>
</td>
</tr>
</tbody>
</table>

## ProductVariationAssignmentVector

Key Value Combination

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
variation<br />
<a href="/api/objects#productvariation"><code>ProductVariation</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
option<br />
<a href="/api/objects#productvariationoption"><code>ProductVariationOption</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductVariationOption



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
texts<br />
<a href="/api/objects#productvariationtexts"><code>ProductVariationTexts</code></a>
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
value<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## ProductVariationTexts



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
locale<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
title<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
subtitle<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## PushSubscription



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
userAgent<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
expirationTime<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
endpoint<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Quotation

Quotation

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
user<br />
<a href="/api/objects#user"><code>User!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
product<br />
<a href="/api/interfaces#product"><code>Product!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#quotationstatus"><code>QuotationStatus!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
created<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
expires<br />
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
isExpired<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
referenceDate<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
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
quotationNumber<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
fullfilled<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
rejected<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
country<br />
<a href="/api/objects#country"><code>Country</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
currency<br />
<a href="/api/objects#currency"><code>Currency</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/objects#productconfigurationparameter"><code>[ProductConfigurationParameter!]</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## SearchResult

Search result

<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
productsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filteredProductsCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
filters<br />
<a href="/api/objects#loadedfilter"><code>[LoadedFilter!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
products<br />
<a href="/api/interfaces#product"><code>[Product!]!</code></a>
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
</tbody>
</table>

</td>
</tr>
</tbody>
</table>

## Shop



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
language<br />
<a href="/api/objects#language"><code>Language</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
country<br />
<a href="/api/objects#country"><code>Country</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
version<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userRoles<br />
<a href="/api/scalars#string"><code>[String!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
externalLinks<br />
<a href="/api/objects#link"><code>[Link]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
adminUiConfig<br />
<a href="/api/objects#adminuiconfig"><code>AdminUiConfig!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
oAuthProviders<br />
<a href="/api/objects#oauthprovider"><code>[OAuthProvider!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
vapidPublicKey<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## SimpleProduct

Simple Product

<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [Product](/api/interfaces#product)

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
catalogPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
currency<br />
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
leveledCatalogPrices<br />
<a href="/api/objects#pricelevel"><code>[PriceLevel!]!</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
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
simulatedPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/inputObjects#productconfigurationparameterinput"><code>[ProductConfigurationParameterInput!]</code></a>
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
simulatedDispatches<br />
<a href="/api/objects#dispatch"><code>[Dispatch!]</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
deliveryProviderType<br />
<a href="/api/enums#deliveryprovidertype"><code>DeliveryProviderType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
referenceDate<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
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
simulatedStocks<br />
<a href="/api/objects#stock"><code>[Stock!]</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
deliveryProviderType<br />
<a href="/api/enums#deliveryprovidertype"><code>DeliveryProviderType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
referenceDate<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
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
<tr>
<td>
dimensions<br />
<a href="/api/objects#dimensions"><code>Dimensions</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
sku<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
baseUnit<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
salesUnit<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
salesQuantityPerUnit<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
defaultOrderQuantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

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
</tbody>
</table>

## Stock



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
deliveryProvider<br />
<a href="/api/objects#deliveryprovider"><code>DeliveryProvider</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
warehousingProvider<br />
<a href="/api/objects#warehousingprovider"><code>WarehousingProvider</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## SuccessResponse



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
success<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Token



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
product<br />
<a href="/api/objects#tokenizedproduct"><code>TokenizedProduct!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#tokenexportstatus"><code>TokenExportStatus!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isInvalidateable<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
accessKey<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>
<p>Get an access key that you can pass along the HTTP Header &quot;x-token-accesskey&quot; to access the token anonymously.</p>
</td>
</tr>
<tr>
<td>
invalidatedDate<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
user<br />
<a href="/api/objects#user"><code>User</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
expiryDate<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contractAddress<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
walletAddress<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
chainId<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
chainTokenId<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
ercMetadata<br />
<a href="/api/scalars#json"><code>JSON</code></a>
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
</tbody>
</table>

## TokenizedProduct

Tokenized Product (Blockchain materialized Product)

<p style={{ marginBottom: "0.4em" }}><strong>Implements</strong></p>

- [Product](/api/interfaces#product)

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
catalogPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
currency<br />
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
leveledCatalogPrices<br />
<a href="/api/objects#pricelevel"><code>[PriceLevel!]!</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
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
simulatedPrice<br />
<a href="/api/objects#price"><code>Price</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
currency<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
useNetPrice<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
quantity<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/inputObjects#productconfigurationparameterinput"><code>[ProductConfigurationParameterInput!]</code></a>
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
simulatedStocks<br />
<a href="/api/objects#stock"><code>[Stock!]</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
referenceDate<br />
<a href="/api/scalars#timestamp"><code>Timestamp</code></a>
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
contractAddress<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contractStandard<br />
<a href="/api/enums#smartcontractstandard"><code>SmartContractStandard</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
contractConfiguration<br />
<a href="/api/objects#contractconfiguration"><code>ContractConfiguration</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tokens<br />
<a href="/api/objects#token"><code>[Token!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tokensCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## User



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
created<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
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
deleted<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
username<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isGuest<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isTwoFactorEnabled<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isInitialPassword<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
webAuthnCredentials<br />
<a href="/api/objects#webauthncredentials"><code>[WebAuthnCredentials!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
web3Addresses<br />
<a href="/api/objects#web3address"><code>[Web3Address!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
pushSubscriptions<br />
<a href="/api/objects#pushsubscription"><code>[PushSubscription!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
name<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
avatar<br />
<a href="/api/objects#media"><code>Media</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
profile<br />
<a href="/api/objects#userprofile"><code>UserProfile</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
language<br />
<a href="/api/objects#language"><code>Language</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
country<br />
<a href="/api/objects#country"><code>Country</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
lastBillingAddress<br />
<a href="/api/objects#address"><code>Address</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
lastContact<br />
<a href="/api/objects#contact"><code>Contact</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
lastLogin<br />
<a href="/api/objects#userlogintracker"><code>UserLoginTracker</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
primaryEmail<br />
<a href="/api/objects#useremail"><code>UserEmail</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
emails<br />
<a href="/api/objects#useremail"><code>[UserEmail!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
roles<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
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
cart<br />
<a href="/api/objects#order"><code>Order</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
orderNumber<br />
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
orders<br />
<a href="/api/objects#order"><code>[Order!]!</code></a>
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
status<br />
<a href="/api/enums#orderstatus"><code>[OrderStatus!]</code></a>
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
includeCarts<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
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
quotations<br />
<a href="/api/objects#quotation"><code>[Quotation!]!</code></a>
</td>
<td>


<p style={{ marginBottom: "0.4em" }}><strong>Arguments</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
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

</td>
</tr>
<tr>
<td>
bookmarks<br />
<a href="/api/objects#bookmark"><code>[Bookmark!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
paymentCredentials<br />
<a href="/api/objects#paymentcredentials"><code>[PaymentCredentials!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
enrollments<br />
<a href="/api/objects#enrollment"><code>[Enrollment!]!</code></a>
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

</td>
</tr>
<tr>
<td>
allowedActions<br />
<a href="/api/enums#roleaction"><code>[RoleAction!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tokens<br />
<a href="/api/objects#token"><code>[Token!]!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
oAuthAccounts<br />
<a href="/api/objects#oauthaccount"><code>[OAuthAccount!]!</code></a>
</td>
<td>

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

</td>
</tr>
</tbody>
</table>

## UserEmail



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
verified<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## UserLoginTracker



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
timestamp<br />
<a href="/api/scalars#timestamp"><code>Timestamp!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
remoteAddress<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
remotePort<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userAgent<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
locale<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
countryCode<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## UserProfile



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
displayName<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
phoneMobile<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
gender<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
birthday<br />
<a href="/api/scalars#date"><code>Date</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
address<br />
<a href="/api/objects#address"><code>Address</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## WarehousingInterface



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
label<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
version<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## WarehousingProvider



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
deleted<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#warehousingprovidertype"><code>WarehousingProviderType</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
interface<br />
<a href="/api/objects#warehousinginterface"><code>WarehousingInterface</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configuration<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
configurationError<br />
<a href="/api/enums#warehousingprovidererror"><code>WarehousingProviderError</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
isActive<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Web3Address



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
address<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
nonce<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
verified<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## WebAuthnCredentials



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
created<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
aaguid<br />
<a href="/api/scalars#string"><code>String!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
counter<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
mdsMetadata<br />
<a href="/api/objects#webauthnmdsv3metadata"><code>WebAuthnMDSv3Metadata</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## WebAuthnMDSv3Metadata



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
legalHeader<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
description<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
authenticatorVersion<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
protocolFamily<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
schema<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
upv<br />
<a href="/api/scalars#json"><code>[JSON!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
authenticationAlgorithms<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
publicKeyAlgAndEncodings<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
attestationTypes<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
userVerificationDetails<br />
<a href="/api/scalars#json"><code>[JSON!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
keyProtection<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
matcherProtection<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
cryptoStrength<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
attachmentHint<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
tcDisplay<br />
<a href="/api/scalars#json"><code>[JSON!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
attestationRootCertificates<br />
<a href="/api/scalars#string"><code>[String!]</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
icon<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
authenticatorGetInfo<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## Work



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
started<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
finished<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
created<br />
<a href="/api/scalars#datetime"><code>DateTime!</code></a>
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
deleted<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
priority<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
type<br />
<a href="/api/enums#worktype"><code>WorkType!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
status<br />
<a href="/api/enums#workstatus"><code>WorkStatus!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
worker<br />
<a href="/api/scalars#string"><code>String</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
input<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
result<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
error<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
success<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
scheduled<br />
<a href="/api/scalars#datetime"><code>DateTime</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
original<br />
<a href="/api/objects#work"><code>Work</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
retries<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
timeout<br />
<a href="/api/scalars#int"><code>Int</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
autoscheduled<br />
<a href="/api/scalars#boolean"><code>Boolean</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## WorkOutput



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
result<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
error<br />
<a href="/api/scalars#json"><code>JSON</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
success<br />
<a href="/api/scalars#boolean"><code>Boolean!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

## WorkStatistics



<p style={{ marginBottom: "0.4em" }}><strong>Fields</strong></p>

<table>
<thead><tr><th>Name</th><th>Description</th></tr></thead>
<tbody>
<tr>
<td>
type<br />
<a href="/api/enums#worktype"><code>WorkType!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
newCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
startCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
errorCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
successCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
<tr>
<td>
deleteCount<br />
<a href="/api/scalars#int"><code>Int!</code></a>
</td>
<td>

</td>
</tr>
</tbody>
</table>

