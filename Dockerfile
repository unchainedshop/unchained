FROM mongo:7.0.14

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source

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

ADD packages /source/
ADD package* /source/
ADD examples/kitchensink/package* /source/examples/kitchensink/
ADD examples/minimal/package* /source/examples/minimal/

ENV MONGOMS_VERSION=7.0.14
ENV MONGOMS_SYSTEM_BINARY=/usr/bin/mongod
ENV NODE_NO_WARNINGS=1
RUN NODE_ENV=development npm install -ws --include-workspace-root

ADD . /source/

# Without the double build, unit tests fail?
RUN npm run build || :
RUN npm run build || :
RUN cd examples/kitchensink && npm install && npm run build || :

CMD ["npm"]