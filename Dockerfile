FROM node:16.13

WORKDIR /usr/src/games_service

COPY package*.json ./

RUN npm install

COPY . .

RUN npx eslint src

ENTRYPOINT [ "node", "src/index.js" ]