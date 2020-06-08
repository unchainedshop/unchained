FROM geoffreybooth/meteor-base:1.10.2

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source
ADD . /source/

RUN NODE_ENV=development meteor npm install
