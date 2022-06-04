FROM node:lts-alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY --from=amacneil/dbmate:v1.6.0 /dbmate /usr/bin/dbmate

RUN npm install

COPY . .
