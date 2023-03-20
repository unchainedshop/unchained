---
title: Warehousing provider
sidebar_title: Manage warehousing provider
---
You can manage warehousing providers supported in your shop by navigating to warehousing provider page **system settings > warehousing providers**

Admin UI supports all the functionalities needed to manage all the configured warehousing plugins in unchained such as:
- View and filter
- Add new warehousing provider
- update existing warehousing provider
- Delete warehousing provider

**Note that in order for you to add a warehousing provider it must be configured and loaded to your shops unchained engine instance before you can manage it using admin UI. Additionally activating and deactivating warehousing providers is controlled by the plugin logic.**


## View and Filter warehousing providers
You can view and filter warehousing providers in added to your shop by type.
![diagram](../images/admin-ui/warehousing-provider/warehousing-provider-list.png)
## Add new warehousing providers
You can add new warehousing provider plugin configured in your system by clicking the add button found in the warehousing providers list.
On the new warehousing provider form you will be provided with a form where you can enter the type and adapter for your warehousing provider. In this case adapter is the warehousingProvider adapter plugin configured and loaded in the engine. 

once successfully submitting the form you will be redirected to the newly created warehousing provider detail page. 

![diagram](../images/admin-ui/warehousing-provider/new-warehousing-provider.png)
## Update warehousing providers
By clicking the edit icon of a particular warehousing provider found on the warehousing provider list view you can edit some part of the warehousing provider, manly the `configuration`.  if there is any configuration error on the warehousing provider you will see a red **x** check mark on the configuration error with any helpful error text.

![diagram](../images/admin-ui/warehousing-provider/edit-warehousing-provider.png)
## Delete warehousing providers

You can delete a warehousing providers in two places either on the list view of warehousing provider page or by opening the detail page of a given warehousing provider. However, be sure your change doesn't cause integrity issue before deleting a currency as the operation is not reversible.