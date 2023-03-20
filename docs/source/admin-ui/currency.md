---
title: Filter
sidebar_title: Manage filters
---

You can add multiple currency support including an ethereum token to your e-commerce and Admin UI provides a friendly interface for. Once you have added a currency and activate it, you will be able to use it on the entire system from product to order pricing plugins.

In admin ui you can: 
- View all the currencies and search and/or filter them.
- Add new currency/token
- Update existing currency
- delete currency
- activate or deactivate 

## View supported currencies

When you navigate to currencies page using the like in navigation, you will see all the currently added currencies and which you can filter by there status or search them.

![diagram](../images/admin-ui/currency/currencies-list.png)

## Add new currency
Go to currencies page and click on the add button to add new currency you want to support in your e-commerce store. You can use the form below to add the currencies ISO code and after submitting you will be redirected to the newly added currency detail page.
On the other hand if you want to add a ERC token as a currency provide the tokens contract address and the tokens precision using the inputs provided. 

![diagram](../images/admin-ui/currency/new-currency-form.png)

## Update currency

On the currencies list, click on the edit icon to view the currency detail information or update it. You can change the `contract address`, `status` and `iso code` of a given currency. However, it is not recommended to change the iso code or contract address because it might have been used on other parts of the system and might cause data integrity issue. So be sure your change doesn't cause integrity issue before updating any of this values.

![diagram](../images/admin-ui/currency/edit-currency.png)


## Delete currency

You can delete a currency in two places either on the list view of currencies page or by opening the detail page of a given currency. However, be sure your change doesn't cause integrity issue before deleting a currency as the operation is not reversible.