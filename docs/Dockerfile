FROM node:12-slim

ENV NODE_ENV production
ENV GATSBY_TELEMETRY_DISABLED 1
ENV BRANCH master

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package* /usr/src/app/
RUN NODE_ENV=development npm install

# Build app
COPY . /usr/src/app/


RUN npm run api-docs
RUN npm run type-docs

RUN npm run build

EXPOSE 9000

CMD npm run start
