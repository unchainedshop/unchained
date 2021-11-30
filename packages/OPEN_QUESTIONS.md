@Pascal

1. Emit event for create, update, delete only on success, right?
2. Error handling with async/await needs some adjustments I think. (Try/catch does not work on await but a catch chained function is required)

3. PaymentProviderType is that a fix constant or to be extended? E.g. should typescript and the schema check for the type or not? 
4. Same question for the PaymentEror. Is this fixed to the constant or are there more errors available?

5. Logical vs physical delete: Does it depend? Or should it be a logical delete?