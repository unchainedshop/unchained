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

11. Documents uses HTTP meteor package. Shall I remove it too?