FROM geoffreybooth/meteor-base:2.7.3

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source
ADD package.json /source/
ADD package-lock.json /source/
ADD examples/minimal/package.json /source/examples/minimal/
ADD examples/minimal/package-lock.json /source/examples/minimal/
ADD examples/controlpanel/package.json /source/examples/controlpanel/
ADD examples/controlpanel/package-lock.json /source/examples/controlpanel/
ADD packages/@unchainedshop /source/packages/@unchainedshop

ENV MONGO_MEMORY_SERVER_FILE /source/jest-mongodb-config.js
ENV MONGOMS_VERSION 5.0.9
ENV NODE_ENV development

RUN meteor npm install


ADD . /source/
ADD env /source/.env
