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

ENV PORT 4010
ENV NODE_ENV production

HEALTHCHECK --start-period=10s --interval=20s --timeout=2s \
  CMD wget -nv -t1 --post-data='{"operationName":null,"variables":{},"query":"{shopInfo {_id}}"}' --header="content-type: application/json" http://localhost:4010/graphql || exit 1

EXPOSE 4010
CMD npm start
