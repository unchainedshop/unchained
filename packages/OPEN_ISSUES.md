## Known OPEN Issues

1. Does the user object exists in the requestContext? So far I used the userId exclusively and fetched the user if needed on the fly.

2. configureOrdersModule --> ensureCartForUser: Can we apply the same logic as for the api --> getOrderCart function? --> Checked by Pascal

3. FilterDirector: What are the options? Could not find a call that provides options and thus I would remove this parameter (except in other implementations it is used) --> Leave open as OPEN ISSUE

4. Npm package: later is deprecated and should be replaced with https://www.npmjs.com/package/@breejs/later --> Leave open as OPEN ISSUE

5. BaseWorker: line 61: Does that work wiht [0]? As far as I could see in the code the schedules need to be strings. But well, it is not really clear to me how this later works... --> 
Leave as is and leave as OPEN ISSUE

6. Roles: Fetch user in roles.ts -> userHasPermission might be unnecessary as the user is set as soon as a user logs in and we have a userId. Is that correct? --> Leave as OPEN ISSUE

