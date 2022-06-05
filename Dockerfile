# Set the environment using a build arg. Default to prod.
ARG BUILD_STAGE=prod


#################################################################
### Base stage needed by all stages.
#################################################################
FROM node:14.17.1-buster-slim as base

# Set env variables used by all stages.
ARG BUILD_STAGE
ARG FE_ENV

ENV BUILD_STAGE=${BUILD_STAGE}
ENV NODE_ENV=development
ENV FE_ENV=${FE_ENV}
ENV USER=node
ENV GROUP=node

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y wget curl make

# Install tini process manager.
RUN curl -sSL https://github.com/krallin/tini/releases/download/v0.18.0/tini > /usr/bin/tini && \
    chmod 755 /usr/bin/tini

#################################################################
### Dev stage.
#################################################################
FROM base as dev

# Install fixuid for fixing file permissions in dev.
RUN curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.4/fixuid-0.4-linux-amd64.tar.gz | tar -C /usr/bin -xzf - && \
    chown root:root /usr/bin/fixuid && \
    chmod 4755 /usr/bin/fixuid && \
    mkdir -p /etc/fixuid && \
    printf "user: $USER\ngroup: $GROUP\n" > /etc/fixuid/config.yml

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install dbmate.
COPY --from=amacneil/dbmate:v1.6.0 /dbmate /usr/bin/dbmate


#################################################################
### Install node modules in a separate stage.
#################################################################
FROM base as node_modules

# Install packages only needed for building node_modules.
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    make g++ python && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /

COPY ./package*.json .npmrc /
RUN npm ci

#################################################################
### Intermediate stage used by test and prod.
#################################################################
FROM base as intermediate

# Build app as non-root user.
RUN chown -R node:node .
USER node:node

# Copy node_modules.
COPY --from=node_modules --chown=node:node /node_modules ./node_modules
COPY --chown=node:node . .
RUN npm rebuild

USER root:root


#################################################################
### Test stage.
#################################################################
FROM intermediate as ci

# Copy dbmate from dev.
COPY --from=dev /usr/bin/dbmate /usr/bin/dbmate


#################################################################
### Prod stage.
#################################################################
FROM intermediate as prod

ENV NODE_ENV=production

# Remove dev node_modules.
RUN npm prune --production


#################################################################
### Final stage determined by build arg.
#################################################################
FROM ${BUILD_STAGE}

USER node:node

RUN npm rebuild

CMD ["node", "."]
