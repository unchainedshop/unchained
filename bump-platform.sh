./clean-packages.sh &&
cd packages/@unchainedshop/types && npm publish && cd .. &&

cd ../logger && npm install && npm publish &&
cd ../roles && npm install && npm publish &&
cd ../utils && npm install && npm publish &&
cd ../events && npm install && npm publish &&
cd ../mongodb && meteor publish &&
cd ../file-upload && npm install && npm publish &&

cd ../core-worker && npm install && npm publish &&
cd ../core-accountsjs && npm install && npm publish &&
cd ../core-assortments && npm install && npm publish &&
cd ../core-bookmarks && npm install && npm publish &&
cd ../core-currencies && npm install && npm publish &&
cd ../core-countries && npm install && npm publish &&
cd ../core-delivery && meteor publish &&
cd ../core-files && meteor publish &&
cd ../core-languages && meteor publish &&
cd ../core-messaging && npm install && npm publish &&
cd ../core-orders && meteor publish &&
cd ../core-payment && meteor publish &&
cd ../core-products && meteor publish &&
cd ../core-filters && meteor publish &&
cd ../core-users && meteor publish &&
cd ../core-quotations && meteor publish &&
cd ../core-enrollments && meteor publish &&
cd ../core-warehousing && meteor publish &&
cd ../core-events && meteor publish &&
cd ../core && meteor publish &&

cd ../api && meteor publish &&
cd ../platform && meteor publish
