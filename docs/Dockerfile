FROM node:16-slim

ENV NODE_ENV production
ENV GATSBY_TELEMETRY_DISABLED 1
ENV BRANCH master

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY types /usr/src/app/types
RUN cd types && NODE_ENV=development npm install && NODE_ENV=development npm run build && npm link
COPY package* /usr/src/app/
RUN NODE_ENV=development npm install && npm link @unchainedshop/types

# Build app
COPY . /usr/src/app/

RUN npm run build

EXPOSE 9000

CMD npm run start
