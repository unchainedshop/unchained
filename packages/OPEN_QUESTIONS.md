@Pascal

1. Emit event for create, update, delete only on success, right?
2. Error handling with async/await needs some adjustments I think. (Try/catch does not work on await but a catch chained function is required)

3. PaymentProviderType is that a fix constant or to be extended? E.g. should typescript and the schema check for the type or not? 
4. Same question for the PaymentEror. Is this fixed to the constant or are there more errors available?

5. Logical vs physical delete: Does it depend? Or should it be a logical delete?

6. File Id: Now it is a manually created string. Keep it or change the externalId pattern?

7. What is the context in a plugin meant to be? general context incl. modules and services. Specific context for function.

8. Why are the events of the core-worker not emitted using the events library, but directly with the node event emitter?

9. Changed sortedAdapters to general getAdapter in Directors function, okay?

10. F.Y.I: Interface definition for plugins extremly time-consuming and complex.

11. Documents is imported in other core packages. Is it a core-package itself? Or does it more follow the events & logger concept

12. Documents uses HTTP meteor package. Shall I remove it too?

13. What is the run command pattern for? That breaks with all the typed logic.

14. The cache block will run with empty ids as the fields definition does include the _id only. What shall I do with such code?

```
Collections.AssortmentLinks.removeLinks = (
  selector,
  { skipInvalidation = false } = {}
) => {
  const assortmentLinks = Collections.AssortmentLinks.find(selector, {
    fields: { _id: true },
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
