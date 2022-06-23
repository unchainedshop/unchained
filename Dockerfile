FROM geoffreybooth/meteor-base:2.7.3

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source
ADD http://downloads.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2004-5.0.9.tgz /source/
ADD package.json /source/
ADD package-lock.json /source/
ADD examples/minimal/package.json /source/examples/minimal/
ADD examples/minimal/package-lock.json /source/examples/minimal/
ADD examples/controlpanel/package.json /source/examples/controlpanel/
ADD examples/controlpanel/package-lock.json /source/examples/controlpanel/
ADD packages/@unchainedshop /source/packages/@unchainedshop

ENV MONGO_MEMORY_SERVER_FILE /source/jest-mongodb-config.js
ENV MONGOMS_DOWNLOAD_DIR /source
ENV MONGOMS_ARCHIVE_NAME mongodb-linux-x86_64-ubuntu2004-5.0.9.tgz
ENV MONGOMS_RUNTIME_DOWNLOAD false

RUN NODE_ENV=development meteor npm install

ADD . /source/
ADD env /source/.env
