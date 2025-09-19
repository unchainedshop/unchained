FROM mongo:8.0.1

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

ENV HOME=/root
ENV NVM_DIR=$HOME/.nvm

RUN apt update -y && apt install -y curl unzip && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && \
    chmod +x $NVM_DIR/nvm.sh && \
    . $NVM_DIR/nvm.sh && \
    nvm install 24.1.0 && \
    nvm alias default 24.1.0 && \
    nvm use 24.1.0

ENV PATH=/root/.nvm/versions/node/v24.1.0/bin:$NVM_DIR:$PATH

ADD packages /source/
ADD package* /source/
ADD examples/kitchensink/package* /source/examples/kitchensink/
ADD examples/kitchensink-express/package* /source/examples/kitchensink-express/
ADD examples/minimal/package* /source/examples/minimal/
ADD examples/oidc/package* /source/examples/oidc/
ADD examples/ticketing/package* /source/examples/ticketing/

ENV MONGOMS_VERSION=8.0.1
ENV MONGOMS_SYSTEM_BINARY=/usr/bin/mongod
ENV NODE_NO_WARNINGS=1
ENV NODE_ENV=test
RUN npm ci

ADD . /source/

RUN npm run build -ws

CMD ["npm"]