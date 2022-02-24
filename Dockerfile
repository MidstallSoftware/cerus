FROM node:16-alpine

RUN mkdir -p /usr/src/server
WORKDIR /usr/src/server

RUN apk update && apk upgrade
RUN apk add git python3 make build-base && ln -sf python3 /usr/bin/python

COPY . /usr/src/server/
RUN npm install
RUN npm run build

ENV NUXT_HOST=0.0.0.0
EXPOSE 3000
CMD [ "npm", "start" ]
