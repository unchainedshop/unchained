# Pinned deliberately: Node 26.0-26.5 leaks Blob.prototype.stream() backing stores
# in eternal V8 handles (nodejs/node#63574, fixed in 26.6.0). Do not revert to node:26.
FROM node:26.8-alpine AS bundler

RUN mkdir -p /source && chown node:node /source
WORKDIR /source
USER node

COPY --chown=node:node package* ./
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
RUN echo "${GIT_COMMIT}" > /webapp/version.txt

ENV PORT=3000
ENV NODE_ENV=production

# Shell-free probe (no curl in the image): POST the shopInfo query, exit 1 on failure.
HEALTHCHECK --start-period=10s --interval=20s --timeout=2s \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/graphql',{method:'POST',headers:{'content-type':'application/json'},body:'{\"query\":\"{shopInfo{_id}}\"}'}).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

EXPOSE 3000
# = `npm start` from package.json, without npm as the parent process.
CMD ["node", "--no-warnings", "--env-file=.env.defaults", "--env-file-if-exists=.env", "--import", "./load_env.js", "lib/boot.js"]
