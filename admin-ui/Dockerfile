FROM node:25-alpine AS bundler

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/

ENV NEXT_TELEMETRY_DISABLED="1"
ENV TZ="Europe/Amsterdam"
ENV NODE_ENV="production"
RUN NODE_ENV="development" npm ci

# Build app
COPY . /usr/src/app/

RUN npm run lint
RUN npm run build
RUN rm -Rf node_modules


FROM node:25-alpine AS runtime

COPY --from=bundler /usr/src/app /usr/src

WORKDIR /usr/src/app

ENV NEXT_TELEMETRY_DISABLED="1"
ENV TZ="Europe/Amsterdam"
ENV NODE_ENV="production"

RUN npm ci

HEALTHCHECK --timeout=1s --start-period=2s \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

EXPOSE 3000

CMD ["npm", "start"]
