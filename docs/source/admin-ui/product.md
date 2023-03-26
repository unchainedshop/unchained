---
title: Products
sidebar_title: Manage products
---

Products are the integral part of any e-commerce shop and Unchained engine provides multiple product types to suit your needs. On the unchained Admin Ui you can mange all your shop products with an intuitive interface and perform tasks suc as:
- Add new product
- Edit product information and Add localized variation of a product information or delete exiting product
- Add media's to a product
- Price a product
- Add token information of a token product type (more detail on this can be found below)
- Create a bundle product
- Add product variation
- Add subscription plan configuration to a product
- Activate deactivate
- View and/or search and/filter product

## Overview
Before we talk about all the product configuration capabilities available in unchained lets first have an overview of the different type of products supported in unchained.

Unchained Engine is a powerful e-commerce platform that enables merchants to create and manage their online stores with ease. It provides a range of features and functionalities that help merchants to sell their products online, such as inventory management, order processing, payment processing, and more. Here are the various types of products that Unchained Engine supports:

1. **SimpleProduct**: A simple product is a standard product with a fixed price and no variations or customization options. This type of product is suitable for merchants who sell standard, one-size-fits-all products that don't require any additional options or configurations. Examples of simple products include a single book or a basic t-shirt.

**Use case**: A clothing store might sell a basic t-shirt as a simple product. The product would have a fixed price and no variations or customization options. Customers would simply choose their size and color, add the item to their cart, and check out.

2. **TokenizedProduct**:A tokenized product is a digital product that is stored on a blockchain network and can be traded as a token. This type of product is useful for merchants who want to sell digital assets [NFT](https://ethereum.org/en/nft/) such as digital art or music in a secure and decentralized way.

**Use case**: An online marketplace for digital art might sell tokenized products that represent ownership of a specific piece of art. Customers would purchase the token and receive ownership of the artwork on the blockchain network. The artwork could then be traded or sold by the customer on the blockchain network.

**Use case**: An online marketplace for digital art might sell tokenized products that represent ownership of a specific piece of art. Customers would purchase the token and receive ownership of the artwork on the blockchain network. The artwork could then be traded or sold by the customer on the blockchain network.

3. **PlanProduct**: A plan product is a subscription-based product that customers pay for on a recurring basis. This type of product is useful for merchants who offer ongoing services or products that require regular replenishment. Examples of plan products include a monthly subscription to a meal delivery service or a quarterly subscription to a magazine.

**Use case**: A meal delivery service might offer a plan product that provides customers with a certain number of meals each week. Customers would sign up for the plan and receive their meals on a recurring basis. The merchant would automatically bill the customer for the plan each month until they cancel.

4. **BundleProduct**: A bundle product is a collection of simple products that are sold as a package. This type of product is useful for merchants who want to sell related products together or provide customers with a discount for purchasing multiple products at once. Examples of bundle products include a set of kitchen utensils or a collection of books.

**Use case**: A bookstore might sell a bundle product that includes multiple books in a specific genre or by a specific author. The bundle would have a discounted price compared to buying each book separately. Customers would add the bundle to their cart and receive all the books in the bundle when they check out.

5. **ConfigurableProduct**: A configurable product is a product that has multiple options or configurations. This type of product is useful for merchants who sell products with variations or customization options, such as clothing with different sizes and colors or laptops with different specifications.

**Use case**: A clothing store might sell a configurable product that allows customers to choose the size, color, and style of a shirt. The price of the shirt would vary based on the selected options. Customers would choose their options, see the updated price, and add the item to their cart.

## View and filter and/or search products
On the products list view page you can browse all the products oin your e-commerce site. You can narrow the scope of products displayed using any of the filter options such as tags and/or status or searching for a specific product.
![diagram](../images/admin-ui/product/products-list.png)

## Add product
You can adding a product to your shop by clicking on the **Add** button found on the product list view where you will be presented with a form similar to the one below. 
In order to create a product you should provide the product title and it's type where type is any of the supported type that the product you are selling in your shop list above.

![diagram](../images/admin-ui/product/new-product-form.png)

## Edit Product
After opening detail view of a product You can update a lot of information of a product based on it's type

### Global update options
Below are updatable options found on every product type
1. **texts**: On this tab you are able to update all the text data of a product including title, subtitle and description etc... Additionally you can also add a localized text to all of the supported language in your shop by selecting the language you want at the top right of the form. 

**Note: In order to add a localized text you first need to add the language on using the [new language form](./language/#add-language).**

![diagram](../images/admin-ui/product/product-text-setting.png)

2. **Media**: On many you want to attach a media file to a product to to convey additional information about the product and/or make the shop user interface friendly. By going to the media tab found on product detail page you can manage media files of a product of a product such as adding, updating or deleting. Additionally you can also add a localized text to all of the supported language in your shop by selecting the language you want at the top right of the form. 
![diagram](../images/admin-ui/product/product-media-setting.png)

3. **Tags**: Tags are useful when you want to add additional information of a product that distinguishes it from other for example. you can add or remove tags to a product by clicking on the tag button found at the top of the page.

![diagram](../images/admin-ui/product/product-tag-settings.png)

4. **Sequence**: You can change the sort order for a product by changing its sequence where a product with the smallest sequence will be returned first

![diagram](../images/admin-ui/product/product-sequence-setting.png)

5. **Status**: By default only active products are returned and all the operations are also performed on a product when it's active. However if you don't want to remove a product from your shop but also don't want to display it to customers for any reason you can change it's status to draft.
Toggling a product status is as easy as toggling the button showing current status of a product and selecting a status.

![diagram](../images/admin-ui/product/publish-draft-product.png)

6. **Delete**: You can remove a product by clicking on the delete button available on a product detail page. a product is deletable only when it is in a **DRAFT** state, so if you want to delete a product that is active change its status to do so.

**Note: be sure your change doesn't cause integrity issue and that the removal of the product does not affect operation of the shop such as active orders before deleting as the operation is not reversible.**


### Scoped update options

![diagram](../images/admin-ui/product/product-bundle-setting.png)



![diagram](../images/admin-ui/product/product-price-setting.png)

![diagram](../images/admin-ui/product/product-subscription-setting.png)

![diagram](../images/admin-ui/product/product-supply-setting.png)


![diagram](../images/admin-ui/product/product-variation-assignment.png)

![diagram](../images/admin-ui/product/product-variation-setting.png)

![diagram](../images/admin-ui/product/product-warehousing-setting.png)



![diagram](../images/admin-ui/product/token-setting.png)