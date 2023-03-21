---
title: Work Queue
sidebar_title: Manage workers
---

Unchained engine utilizes a worker module to perform various task related with a shops operation. you can manage workers configured in the engine using admin ui and perform tasks such as
- View and filter work queue
- Add work
- allocate work
- delete work 

## View work queue
You can view all the active and complete workers in the engine by navigating to **activities > work queue**. In this page you are able to search and/or filter the work queue using different methods such as
- work start and and date
- worker type
- worker status

![diagram](../images/admin-ui/work-queue/work-queue-list.png)

## Work detail
By clicking on the work list item you can explore more details about a specific worker, such as it's status, start and end time, duration, input and result and any error that occurred during execution among many other.

![diagram](../images/admin-ui/work-queue/work-detail.png)

## Add work
You can add work to the work queue by clicking on the **manage** button found in the work list page. in order to add a worker the Worker adapter must be configured in the engine and activated. 
Add work provides fields for you to select the Worker **type** and any optional additional information you want to pass to the worker and worker module such as
- `priority` where anything closer to 0 including 0 is given high priority over other workers with larger priority
- `retries` determines how many time a worker should be retried by the worker module in case of an error attempts
- `original work id` only applicable if you want to use a previously run worker. in which case you provide the worker id
- `scheduled`defines when to run the worker. if left `undefined` it will be run to the closes time possible.
- `input` is data that should be passed to the worker based on the configuration

when adding a new worker it will have a status of **New** automatically

![diagram](../images/admin-ui/work-queue/add-work-form.png)
## Allocate work
If you want to start a worker or multiple that is in work queue that has a status of **NEW** manually, using allocate work to start the worker.

![diagram](../images/admin-ui/work-queue/allocate-work-form.png)

## Delete work
Only a work with a status of **NEW** can be deleted in unchained and you can delete a work by opening it's detail page and clicking on the delete button found. 

![diagram](../images/admin-ui/work-queue/delete-work.png)
