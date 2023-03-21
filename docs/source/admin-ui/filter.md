---
title: Filter
sidebar_title: Manage filters
---
Filters give you the capability to make products and categories in your e-commerce shop easily accessible. Because Unchained has a built in support for defining filters for categories and products admin UI provides the a user friendly user interface you can use to manage filters. 
Such as:
- View filters
- Add Filter
- Add filter options
- update filter
- Update filter option
- Delete filter
- Delete filter option
- activate/deactivate filter

**Before a filter becomes usable for a category you need to link it by going to the assortment detail page.**
## View filters
By navigating to **filters** page you can view all the filters that exist in your shop which you can search and/or filter and change the language.
![diagram](../images/admin-ui/filter/filters-list.png)

## Add filter
By clicking on the **add** button found in the filters list page you can add a filter using the form presented. 
The form has the following input fields
- `Title` -  name/title of the filter 
- `key` -  Unique identifier og the filter
- `type` - the kind of filter **SWITCH** is similar to a boolean/toggle, **SINGLE_CHOICE** the filter options should behave like a radio button for example, **MULTIPLE_CHOICE** if multiple options of the filter can be applied at the same time and **RANGE** is when you want to have for example a date filter where a user can select a start end end date range filter.
- `options` -  the actual filter options that will be applied to filter content. as you can noticed from the type field a filter can have one or multiple options.


![diagram](../images/admin-ui/filter/new-filter-form.png)

## View and edit filter
By clicking on a filter from the list you can view and/or edit a particular filter. in addition if your shop is localized you can also add localized title and subtitle to the filter.
Note that in-order to add a localized text for a specific language you need to [add the language](./language/#add-language) first by navigating to the language page.

![diagram](../images/admin-ui/filter/filter-detail-text.png)
## Activate/deactivate filter
On the filter detail page you will find a button at the top right corner that displays current status of a filter. You can use this button to toggle the status of a filter to active or inactive depending on it's current status.

![diagram](../images/admin-ui/filter/filter-activate-deactivate.png)

## View and edit filter options
The option tab found in the filter detail page enables you to edit the title and subtitle of an option.
It is also possible yo add localized text to filter options for a specific language but you need to [add the language](./language/#add-language) first by navigating to the language page.

![diagram](../images/admin-ui/filter/filter-edit-option.png)

## Add filter option
You can add additional option to a filter after it's been created by navigating to the filter detail options tab.

![diagram](../images/admin-ui/filter/filter-add-option.png)

## Delete filter

You can delete a filter in two places either on the list view of filters page or by opening the detail page of a given filter. However, be sure your change doesn't cause integrity issue before deleting a filter as the operation is not reversible.