---
title: Orders
sidebar_title: Manage orders
---

Orders are the main goal of an E-commerce and unchained admin UI is provides all the functionalities that are needed to view and manage all the orders in your shop easily.

Below are all the functionalities provided in admin-ui
- View all orders with search and filter support
- track status of a given order
- Confirm pending orders
- Manually mark an order as paid (Automation is supported by unchained)
- Manually mark order as delivered (Automation is supported by unchained)
- Manually reject order (Automation is supported by unchained)
- Delete pending orders
- View all the details stored of a specific order

## View and filter orders
You can view all order in your shop including carts by navigating to orders. in addition you can also search for a given order by it `orderNumber`. If you want to also include carts in the list just toggle the show carts button.

![diagram](../images/admin-ui/order/orders-list.png)


## Order details

The order detail page displays all the information relating to the order in addition to perform certain tasks to it. below are all the functionalities available to perform on an order based on its status.

- **Delete** - you can delete and order/cart that has an **OPEN** status only
- **Confirm** - you can mark an order as confirmed when an order in on a **PENDING** status only 
- **Reject** - you can mark an order as reject when an order in on a **PENDING** status only 
- **Reject** - you can mark an order as reject when an order in on a **PENDING** status only 
- **Mark as Paid** - you can change the payment status of an order to **PAID** if needed. 
- **Mark as Delivered** - you can change the Delivery status of an order to **DELIVERED** if needed.

**Note each operation is available based on the status of a given order and they are not available on order status that don't support the action by design. Additionally, all the operations are not reversible, i.e Once a given operation is performed, it can not be undone.**

![diagram](../images/admin-ui/order/order-detail.png)