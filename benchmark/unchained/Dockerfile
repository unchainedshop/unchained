FROM node:22-alpine AS bundler

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

# Copy package files
COPY package*.json /source/
COPY examples/kitchensink/package*.json /source/examples/kitchensink/

# Install dependencies
RUN NODE_ENV=development npm install

# Copy source files
COPY . /source/

# Build
RUN npm run build || :
RUN cd examples/kitchensink && npm run build || :

FROM mongo:7.0.14 AS runtime

# Install Node.js
ENV HOME=/root
ENV NVM_DIR=$HOME/.nvm

RUN apt update -y && apt install -y curl unzip && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash && \
    chmod +x $NVM_DIR/nvm.sh && \
    . $NVM_DIR/nvm.sh && \
    nvm install 22.14.0 && \
    nvm alias default 22.14.0 && \
    nvm use 22.14.0

ENV PATH=/root/.nvm/versions/node/v22.14.0/bin:$NVM_DIR:$PATH

# Copy the app
WORKDIR /webapp
COPY --from=bundler /source /webapp

# Install production dependencies
RUN cd /webapp && NODE_ENV=production npm install --omit=dev
RUN cd /webapp/examples/kitchensink && NODE_ENV=production npm install --omit=dev

# Copy benchmark seed script
COPY benchmark/unchained/benchmark-seed.js /webapp/examples/kitchensink/src/benchmark-seed.js

# Environment variables
ENV PORT 3000
ENV NODE_ENV production
ENV MONGOMS_VERSION=7.0.14
ENV MONGOMS_SYSTEM_BINARY=/usr/bin/mongod
ENV NODE_NO_WARNINGS=1
ENV UNCHAINED_SEED_PASSWORD=password
ENV UNCHAINED_CURRENCY=USD,CHF
ENV UNCHAINED_COUNTRY=US,CH
ENV UNCHAINED_LANG=en
ENV EMAIL_FROM=noreply@localhost
ENV UNCHAINED_MAIL_RECIPIENT=noreply@localhost

# Expose port
EXPOSE 3000
EXPOSE 27017

# Start MongoDB and the app
CMD mongod --fork --logpath /var/log/mongodb.log && cd /webapp/examples/kitchensink && node --no-warnings --env-file .env.defaults --import ./load_env.js lib/boot.js