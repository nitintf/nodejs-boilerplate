# Set the environment using a build arg. Default to prod.
ARG BUILD_STAGE=prod

#################################################################
### Base stage needed by all stages.
#################################################################
FROM node:17.8.0-alpine as base

ENV BUILD_STAGE=${BUILD_STAGE}

WORKDIR /usr/src/app

#################################################################
### Dev stage.
#################################################################

# Install dbmate.
COPY --from=amacneil/dbmate:v1.6.0 /dbmate /usr/bin/dbmate

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4000

RUN npm run build

CMD [ "node", "dist/index.js" ]
