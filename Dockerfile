FROM node:16-alpine

RUN apk update && apk upgrade
RUN apk add git python3 make build-base && ln -sf python3 /usr/bin/python

RUN rm -rf /usr/src/server
RUN mkdir -p /usr/src/server
WORKDIR /usr/src/server

COPY . /usr/src/server/
RUN npm install
RUN cd submodules/discord.js && npm install
RUN npm run build

ENV NUXT_HOST=0.0.0.0
EXPOSE 3000
CMD [ "npm", "start" ]
