FROM geoffreybooth/meteor-base:1.10.2 as bundler

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source
ADD package.json /source/
ADD package-lock.json /source/
RUN NODE_ENV=development meteor npm install

# Build app
ADD . /source/
RUN meteor build --server-only --allow-superuser --directory /



FROM node:12 as runtime

RUN useradd -u 501 -d /home/meteor meteor

RUN mkdir /unchained-uploads && \
  chmod 777 /unchained-uploads

VOLUME /unchained-uploads

# Install app dependencies
COPY --from=bundler /bundle/programs/server/package* /webapp/programs/server/
WORKDIR /webapp/programs/server
RUN NODE_ENV=production npm install

# Copy the app
COPY --from=bundler /bundle /webapp/
RUN NODE_ENV=production npm run install --production
WORKDIR /webapp

ENV PORT 3000
ENV NODE_ENV production

EXPOSE 3000
USER meteor
CMD node main.js
