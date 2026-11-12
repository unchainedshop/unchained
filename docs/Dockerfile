# Bundler on a glibc (Debian trixie) node image: the runtime is distroless
# debian13, so anything native built here must match its libc — not alpine.
FROM node:26.13.0-trixie-slim AS bundler

RUN mkdir -p /source && chown node:node /source
WORKDIR /source
USER node

COPY --chown=node:node package*.json ./
RUN NODE_ENV=development npm ci

COPY --chown=node:node . .

# Build (a failing build must fail the image build), then keep only the
# production dependencies `docusaurus serve` loads.
RUN npm run build && \
    NODE_ENV=production npm prune --omit=dev && \
    npm cache clean --force

ARG GIT_COMMIT="n/a"
# `docusaurus serve` serves build/ — static/ is only read at build time, so the
# version marker must land in build/ to be reachable at /version.
RUN echo "${GIT_COMMIT}" > /source/build/version

# Shell-free runtime: no shell, no npm, no package manager; uid/gid 65532.
FROM gcr.io/distroless/nodejs26-debian13:nonroot AS runtime
# Pin the actual Node executable to the patched builder version: the mutable
# distroless tag can lag Node security releases.
COPY --from=bundler /usr/local/bin/node /nodejs/bin/node
# Copy before WORKDIR so the directory itself belongs to the runtime uid.
COPY --chown=65532:65532 --from=bundler /source /webapp
WORKDIR /webapp

ENV PORT=3000
ENV NODE_ENV=production
ENV PATH="/nodejs/bin:${PATH}"
USER 65532:65532

# Shell-free probe: the docs site answers GET / (no curl/wget needed).
HEALTHCHECK --start-period=10s --interval=20s --timeout=5s \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

EXPOSE 3000
# = `docusaurus serve`, without npm as the parent process; bind all interfaces.
# --no-open: serve otherwise spawns the `open` package's xdg-open shell script,
# and without a shell that spawn fails with ENOENT and crashes the server.
ENTRYPOINT ["/nodejs/bin/node"]
CMD ["node_modules/@docusaurus/core/bin/docusaurus.mjs", "serve", "--host", "0.0.0.0", "--port", "3000", "--no-open"]
