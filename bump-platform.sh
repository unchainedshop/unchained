rm -Rf packages/*/.npm &&
cd packages/utils && meteor publish &&
cd ../core-logger && meteor publish &&
cd ../core-events && meteor publish &&
cd ../core-settings && meteor publish &&
cd ../core-languages && meteor publish &&
cd ../core-currencies && meteor publish &&
cd ../core-countries && meteor publish &&
cd ../core-worker && meteor publish &&
cd ../core-files && meteor publish &&
cd ../core-accountsjs && meteor publish &&
cd ../core-users && meteor publish &&
cd ../core-documents && meteor publish &&
cd ../core-pricing && meteor publish &&
cd ../core-messaging && meteor publish &&
cd ../core-discounting && meteor publish &&
cd ../core-delivery && meteor publish &&
cd ../core-payment && meteor publish &&
cd ../core-warehousing && meteor publish &&
cd ../core-products && meteor publish &&
cd ../core-assortments && meteor publish &&
cd ../core-filters && meteor publish &&
cd ../core-subscriptions && meteor publish &&
cd ../core-quotations && meteor publish &&
cd ../core-orders && meteor publish &&
cd ../core-bookmarks && meteor publish &&
cd ../core && meteor publish &&
cd ../roles && meteor publish &&
cd ../api && meteor publish &&
cd ../platform && meteor publish
