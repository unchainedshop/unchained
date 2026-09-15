FROM node:26.8-alpine AS bundler

RUN mkdir -p /source && chown node:node /source
WORKDIR /source
USER node

COPY --chown=node:node package*.json ./
RUN NODE_ENV=development npm ci

COPY --chown=node:node . .

# Build (a failing build must fail the image build)
RUN npm run build
RUN rm -Rf node_modules

FROM node:26.8-alpine AS runtime

RUN mkdir -p /webapp && chown node:node /webapp
WORKDIR /webapp
USER node

COPY --chown=node:node --from=bundler /source ./
RUN NODE_ENV=production npm ci --omit=dev && npm cache clean --force

ARG GIT_COMMIT="n/a"
# `docusaurus serve` serves build/ — static/ is only read at build time, so the
# version marker must land in build/ to be reachable at /version.
RUN echo "${GIT_COMMIT}" > /webapp/build/version

ENV PORT=3000
ENV NODE_ENV=production

# Shell-free probe: the docs site answers GET / (no curl/wget needed).
HEALTHCHECK --start-period=10s --interval=20s --timeout=5s \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

EXPOSE 3000
# = `docusaurus serve`, without npm as the parent process; bind all interfaces.
CMD ["node", "node_modules/@docusaurus/core/bin/docusaurus.mjs", "serve", "--host", "0.0.0.0", "--port", "3000"]
