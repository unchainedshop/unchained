FROM geoffreybooth/meteor-base:2.0

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source
ADD . /source/

RUN NODE_ENV=development meteor npm install
