FROM node:16

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

# ADD http://downloads.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2004-5.0.9.tgz /source/
ADD package.json /source/
ADD package-lock.json /source/
ADD packages /source/
ADD examples/kitchensink/package.json /source/examples/kitchensink/
ADD examples/kitchensink/package-lock.json /source/examples/kitchensink/
ADD examples/controlpanel/package.json /source/examples/controlpanel/
ADD examples/controlpanel/package-lock.json /source/examples/controlpanel/
ADD jest-mongodb-config.js /source/jest-mongodb-config.js

RUN NODE_ENV=development npm install

ADD . /source/
ADD env /source/.env

RUN npm run build || :