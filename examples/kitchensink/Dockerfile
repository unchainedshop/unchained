FROM node:16

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

ADD package.json /source/
ADD package-lock.json /source/
ADD packages/* /source/node_modules/

RUN NODE_ENV=development npm install
RUN npm run build || :

ADD . /source/

# Add Version
ARG GIT_COMMIT="n/a"
RUN echo "${GIT_COMMIT}" > /source/version.txt

HEALTHCHECK --start-period=10s --interval=20s --timeout=2s \
  CMD curl -f http://localhost:3000/graphql -H 'content-type: application/json' --data-binary '{"operationName":null,"variables":{},"query":"{\n  shopInfo {\n    _id\n  }\n}\n"}' || exit

ENV PORT 3000
ENV NODE_ENV production

EXPOSE 3000
CMD npm start
