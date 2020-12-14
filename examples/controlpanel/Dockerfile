FROM node:12-alpine

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN NODE_ENV=development npm install
RUN npm run lint

# Build app
COPY . /usr/src/app/
RUN npm run preexport && npm prune --production


EXPOSE 3000

CMD [ "node", "node_modules/.bin/next", "start" ]
