FROM node:16-alpine

LABEL org.opencontainers.image.source=https://github.com/eces/select

WORKDIR /app

RUN yarn add selectfromuser@latest

CMD npx slt