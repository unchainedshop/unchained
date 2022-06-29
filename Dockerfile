FROM geoffreybooth/meteor-base:2.7.3

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

# ADD http://downloads.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2004-5.0.9.tgz /source/
ADD package.json /source/
ADD package-lock.json /source/
ADD examples/minimal/package.json /source/examples/minimal/
ADD examples/minimal/package-lock.json /source/examples/minimal/
ADD examples/controlpanel/package.json /source/examples/controlpanel/
ADD examples/controlpanel/package-lock.json /source/examples/controlpanel/
ADD packages /source/node_modules

ENV MONGO_MEMORY_SERVER_FILE /source/jest-mongodb-config.js
ENV MONGOMS_DOWNLOAD_URL http://downloads.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2004-5.0.9.tgz
ENV MONGOMS_DOWNLOAD_DIR /source
ENV MONGOMS_SYSTEM_BINARY=/usr/bin/mongod
ENV MONGOMS_RUNTIME_DOWNLOAD false

RUN NODE_ENV=development meteor npm install

# Install MongoDB on Ubuntu 22.04
RUN apt install -y gnupg
RUN sh -c 'curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -'
RUN sh -c 'echo "deb http://security.ubuntu.com/ubuntu impish-security main" | tee /etc/apt/sources.list.d/impish-security.list'
RUN sh -c 'echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list'
RUN apt update && apt install -y mongodb-org

ADD . /source/
ADD env /source/.env
