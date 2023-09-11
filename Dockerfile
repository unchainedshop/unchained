FROM node:18-bullseye

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

ADD packages /source/
ADD package* /source/
ADD examples/kitchensink/package* /source/examples/kitchensink/
ADD jest-mongodb-config.js /source/jest-mongodb-config.js

RUN NODE_ENV=development npm install

ADD . /source/
ADD env /source/.env

RUN npm run build || :