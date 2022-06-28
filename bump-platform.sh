./clean-packages.sh &&
cd packages/@unchainedshop/types && npm publish &&
cd ../logger && npm install && npm publish &&
cd ../roles && npm install && npm publish &&
cd ../utils && npm install && npm publish &&
cd ../events && npm install && npm publish &&
cd ../file-upload && npm install && npm publish &&
cd ../core-worker && npm install && npm publish &&
cd ../core-accountsjs && npm install && npm publish &&
cd ../core-assortments && npm install && npm publish &&
cd ../core-bookmarks && npm install && npm publish &&
cd ../core-currencies && npm install && npm publish &&
cd ../core-countries && npm install && npm publish &&
cd ../core-delivery && npm install && npm publish &&
cd ../core-files && npm install && npm publish &&
cd ../core-languages && npm install && npm publish &&
cd ../core-messaging && npm install && npm publish &&
cd ../core-orders && npm install && npm publish &&
cd ../core-payment && npm install && npm publish &&
cd ../core-products && npm install && npm publish &&
cd ../core-filters && npm install && npm publish &&
cd ../core-users && npm install && npm publish &&
cd ../core-quotations && npm install && npm publish &&
cd ../core-enrollments && npm install && npm publish &&
cd ../core-warehousing && npm install && npm publish &&
cd ../core-events && npm install && npm publish &&
cd ../core && npm install && npm publish &&
cd .. &&
cd ../mongodb && meteor publish &&
cd ../api && meteor publish &&
cd ../platform && meteor publish
