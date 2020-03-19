FROM node:12.16.1-slim

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app
RUN npm install --only=dev && npm install
RUN npm run preexport

EXPOSE 3000
CMD [ "node", "node_modules/.bin/next", "start" ]
