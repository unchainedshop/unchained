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