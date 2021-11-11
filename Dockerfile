FROM geoffreybooth/meteor-base:2.4

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source
ADD . /source/
ADD env /source/.env

RUN NODE_ENV=development MONGOMS_VERSION=4.4.4 meteor npm install @shelf/jest-mongodb
RUN NODE_ENV=development meteor npm install
