@Pascal

1. Core packages should not import core packages. Is that correct? --> Structuring with directors (plugin handlers).

- Discounting into orders
- Pricing directors into specific package (delivery, products)
- Pricing Base directors into utils


2. Error handling with async/await needs some adjustments I think. (Try/catch does not work on await but a catch chained function is required)

// --> const result await something().catch(error => {})


3. PaymentProviderType is that a fix constant or to be extended? E.g. should typescript and the schema check for the type or not?
4. Same question for the PaymentError. Is this fixed to the constant or are there more errors available?

- Master is graphQL schema
- Use enum for typescript
- DB Schema remains a string (allowedValues)


5. Logical vs physical delete: Does it depend? Or should it be a logical delete?
- Leave as is 

6. File Id: Now it is a manually created string. Keep it or change the externalId pattern?
- Generate _id and use Mike's logic with externalId

7. What is the context in a plugin meant to be? general context incl. modules and services. Specific context for function.


8. Why are the events of the core-worker not emitted using the events library, but directly with the node event emitter?

- Leave as is.

9. Changed sortedAdapters to general getAdapters in Directors function, okay?

- Accepted

10. F.Y.I.: Interface definition for plugins extremly time-consuming and complex. There is no option to define properly a class with static methods.

- Refactor existing plugins.
- Delivery Plugins and Warehousing Adapters: Send is overwritten most of the times

11. DONE: Documents is imported in other core packages. Is it a core-package itself? Or does it more follow the events & logger concept
12. DONE: Documents uses HTTP meteor package. Shall I remove it too?
- Delete documents

13. What is the run command pattern for? That breaks with all the typed logic.
- replace with concrete implementations

14. The cache block will run with empty ids as the fields definition does include the _id only. What shall I do with such code?

```
Collections.AssortmentLinks.removeLinks = (
  selector,
  { skipInvalidation = false } = {}
) => {
  const assortmentLinks = Collections.AssortmentLinks.find(selector, {
    fields: { _id: true, parentAssortmentId: true },
  }).fetch();

  Collections.AssortmentLinks.remove(selector);
  assortmentLinks.forEach((assortmentLink) =>
    emit('ASSORTMENT_REMOVE_LINK', { assortmentLinkId: assortmentLink._id })
  );

  if (!skipInvalidation && assortmentLinks.length) {
    Collections.Assortments.invalidateCache({
      _id: {
        $in: assortmentLinks.map(
          (assortmentLink) => assortmentLink.parentAssortmentId
        ),
      },
    });
  }

  return assortmentLinks;
};
```

- Note to Pascal on basecamp

15. Decision: MongoDB ids are always strings in Unchained



## New OPEN Questions

1. How should dependencies for plugins be integrated / documented? (example: Payment Plugin bity.ts)

2. Naming for class constructor in Directors and Adapters for now 'actions'. Better suggestion?

3. Is product-discount type used (in api/resolvers/types/product-discount.js)

4. Order Payment: core-orders/order-payments/helpers --> markPaid and api/resolvers/mutations/payOrder: Different check for status
  if (payment.status !== OrderPaymentStatus.OPEN && order.confirmed)  vs
  if (payment.status !== OrderPaymentStatus.OPEN)
What happens if the first one passes and the second not?

5. Does the user object exists in the requestContext? So far I used the userId exclusively and fetched the user if needed on the fly.

6. configureOrdersModule --> ensureCartForUser: Can we apply the same logic as for the api --> getOrderCart function?

7. OrderDiscountable does not seem to be resolved correctly.

8. Is the function addDiscount in order helpers used somewhere?

9. Enrollments/helpers addEnrollmentPeriod: OrderId is not defined in db schema but filled in the helper method.

10. Orders/helpers: generateFromCheckout: order.meta does not exist on Order. Leave empty? or context?

11. FilterDirector: What are the options? Could not find a call that provides options and thus I would remove this parameter (except in other implementations it is used)

12. Filters --> Helper: Delete Filter should also delete the FilterTexts of this filter, right? (Similar to assortments)

13. Media created with core-documents director can also be deleted? (e.g. Quotation Proposal)

14. Quotations --> helpers: documents still required (after deletion of core-documents)?

15. In roles/loggedIn there is a check for the ProductReviews userId but there is no userId on the ProductsReview schema. What is the right check here? (AuthorId or add a userId)?

16. Platform: setup-accounts file: The users collection is attached to the accountsServer instance like this `accountsServer.users = Users` What is it used for and where?

17. Npm package: later is deprecated and should be replaced with https://www.npmjs.com/package/@breejs/later

18. BaseWorker: line 61: Does that work wiht [0]? As far as I could see in the code the schedules need to be strings. But well, it is not really clear to me how this later works...