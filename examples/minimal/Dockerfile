FROM node:24-alpine AS bundler

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

ADD package* /source/
RUN NODE_ENV=development npm ci

ADD . /source/

ENV PORT=3000
ENV NODE_ENV=production

HEALTHCHECK --start-period=10s --interval=20s --timeout=2s \
  CMD curl -f http://localhost:3000/graphql -H 'content-type: application/json' --data-binary '{"operationName":null,"variables":{},"query":"{\n  shopInfo {\n    _id\n  }\n}\n"}' || exit

EXPOSE 3000
CMD ["npm", "start"]
