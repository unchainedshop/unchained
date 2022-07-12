./clean-packages.sh &&
cd packages/types && npm publish &&
cd ../mongodb && npm publish &&
cd ../logger && npm publish &&
cd ../roles && npm publish &&
cd ../utils && npm publish &&
cd ../events && npm publish &&
cd ../file-upload && npm publish &&
cd ../core-worker && npm publish &&
cd ../core-accountsjs && npm publish &&
cd ../core-assortments && npm publish &&
cd ../core-bookmarks && npm publish &&
cd ../core-currencies && npm publish &&
cd ../core-countries && npm publish &&
cd ../core-delivery && npm publish &&
cd ../core-files && npm publish &&
cd ../core-languages && npm publish &&
cd ../core-messaging && npm publish &&
cd ../core-orders && npm publish &&
cd ../core-payment && npm publish &&
cd ../core-products && npm publish &&
cd ../core-filters && npm publish &&
cd ../core-users && npm publish &&
cd ../core-quotations && npm publish &&
cd ../core-enrollments && npm publish &&
cd ../core-warehousing && npm publish &&
cd ../core-events && npm publish &&
cd ../core && npm publish &&
cd ../api && npm publish &&
cd ../plugins && npm publish &&
cd ../platform && npm publish



npm install --save-dev esbuild fast-glob jest ts-jest && npm uninstall @types/chai @types/mocha typescript mocha chai babel-jest @babel/core @babel/preset-env @babel/preset-typescript && rm tsconfig.build.json

"scripts": {
    "prepublishOnly": "npm install && npm run build",
    "clean": "rm -rf lib",
    "build": "npm run clean && node esbuild.js",
    "watch": "ESBUILD_WATCH=1 node esbuild.js",
    "test": "jest --watch"
  },

npm link @unchainedshop/types && npm run build && npx tsc && npm run test
