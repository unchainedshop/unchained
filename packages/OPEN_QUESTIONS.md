@Pascal

1. Emit event for create, update, delete only on success, right?
2. Error handling with async/await needs some adjustments I think. (Try/catch does not work on await but a catch chained function is required)
