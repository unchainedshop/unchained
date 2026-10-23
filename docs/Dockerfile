FROM node:26.11.1-alpine AS bundler

WORKDIR /source
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN rm -rf node_modules

FROM node:26.11.1-alpine AS runtime

RUN mkdir -p /webapp && chown node:node /webapp
WORKDIR /webapp
COPY --chown=node:node --from=bundler /source /webapp
RUN npm ci --omit=dev && npm cache clean --force

ARG GIT_COMMIT="n/a"
RUN echo "${GIT_COMMIT}" > /webapp/build/version

ENV PORT=3000
ENV NODE_ENV=production
USER node

HEALTHCHECK --start-period=10s --interval=20s --timeout=5s \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

EXPOSE 3000
CMD ["node", "node_modules/@docusaurus/core/bin/docusaurus.mjs", "serve", "--host", "0.0.0.0", "--port", "3000"]
