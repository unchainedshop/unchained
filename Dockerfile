FROM node:22

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

ADD packages /source/
ADD package* /source/
ADD examples/kitchensink/package* /source/examples/kitchensink/
ADD examples/minimal/package* /source/examples/minimal/
ADD jest-mongodb-config.cjs /source/jest-mongodb-config.cjs

RUN NODE_ENV=development npm ci

ADD . /source/
ADD env /source/.env

RUN npm run build || :