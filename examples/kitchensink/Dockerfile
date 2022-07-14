FROM node:16 as bundler

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

ADD package* /source/
RUN NODE_ENV=development npm install

ADD . /source/

# Build
RUN npm run build || :
RUN rm -Rf node_modules

FROM node:16-alpine as runtime

# Copy the app
WORKDIR /webapp
COPY --from=bundler /source /webapp
RUN NODE_ENV=production npm install --omit=dev

ARG GIT_COMMIT="n/a"
RUN echo "${GIT_COMMIT}" > /webapp/version.txt

HEALTHCHECK --start-period=10s --interval=20s --timeout=2s \
  CMD curl -f http://localhost:3000/graphql -H 'content-type: application/json' --data-binary '{"operationName":null,"variables":{},"query":"{\n  shopInfo {\n    _id\n  }\n}\n"}' || exit

ENV PORT 3000
ENV NODE_ENV production

EXPOSE 3000
CMD npm start
