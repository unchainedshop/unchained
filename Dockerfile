FROM geoffreybooth/meteor-base:2.7.1

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

RUN \
  NODE_ENV=development MONGOMS_VERSION=5.0.6 meteor npm install @shelf/jest-mongodb && \
  NODE_ENV=development meteor npm install


ADD . /source/
ADD env /source/.env
