---
title: Delivery provider
sidebar_title: Manage delivery providers
---
You can manage delivery providers supported in your shop by navigating to delivery provider page **system settings > delivery providers**

Admin UI supports all the functionalities needed to manage all the configured delivery plugins in unchained such as:
- View and filter
- Add new delivery provider
- update existing delivery provider
- Delete delivery provider

**Note that in order for you to add a delivery provider it must be configured and loaded to your shops unchained engine instance before you can manage it using admin UI. Additionally activating and deactivating delivery providers is controlled by the plugin logic.**


## View and Filter delivery providers
You can view and filter delivery providers in added to your shop by type.
![diagram](../images/admin-ui/delivery-provider/delivery-provider-list.png)
## Add new delivery providers
You can add new delivery provider plugin configured in your system by clicking the add button found in the delivery providers list.
On the new delivery provider form you will be provided with a form where you can enter the type and adapter for your delivery provider. In this case adapter is the DeliveryProvider adapter plugin configured and loaded in the engine. 

once successfully submitting the form you will be redirected to the newly created delivery provider detail page. 

![diagram](../images/admin-ui/delivery-provider/new-delivery-provider-form.png)

## Update delivery providers
By clicking the edit icon of a particular delivery provider found on the delivery provider list view you can edit some part of the delivery provider, manly the `configuration`.  if there is any configuration error on the delivery provider you will see a red **x** check mark on the configuration error with any helpful error text.

![diagram](../images/admin-ui/delivery-provider/edit-delivery-provider.png)


## Delete delivery providers

You can delete a delivery providers in two places either on the list view of delivery provider page or by opening the detail page of a given delivery provider. However, be sure your change doesn't cause integrity issue before deleting a currency as the operation is not reversible.