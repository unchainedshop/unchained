FROM mongo:8.2.3

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

ENV HOME=/root
ENV NVM_DIR=$HOME/.nvm

RUN apt update -y && apt install -y curl unzip libatomic1 && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && \
    chmod +x $NVM_DIR/nvm.sh && \
    . $NVM_DIR/nvm.sh && \
    nvm install 26 && \
    nvm alias default 26 && \
    nvm use default && \
    ln -sfn "$NVM_DIR/versions/node/$(nvm version default)" "$NVM_DIR/versions/node/current"

ENV PATH=$NVM_DIR/versions/node/current/bin:$NVM_DIR:$PATH

ADD packages /source/
ADD package* /source/
ADD examples/kitchensink/package* /source/examples/kitchensink/
ADD examples/kitchensink-express/package* /source/examples/kitchensink-express/
ADD examples/minimal/package* /source/examples/minimal/
ADD examples/oidc/package* /source/examples/oidc/
ADD examples/ticketing/package* /source/examples/ticketing/

ENV MONGOMS_VERSION=8.2.3
ENV MONGOMS_SYSTEM_BINARY=/usr/bin/mongod
ENV NODE_NO_WARNINGS=1
ENV NODE_ENV=test
RUN npm ci

ADD . /source/

RUN npm run build

CMD ["npm"]