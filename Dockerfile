FROM node:16.13 AS UI_BUILDER
WORKDIR /usr/src/games_service_ui
COPY ui/package*.json ./
RUN npm install
COPY ./ui .
RUN npm run build

FROM node:16.13
WORKDIR /usr/src/games_service
COPY service/package*.json ./
RUN npm install
COPY ./service .
RUN rm -f .env
COPY --from=UI_BUILDER /usr/src/games_service_ui/dist ./src/vue
RUN npx eslint src
ENV NODE_ENV=production

ENTRYPOINT ["node", "src/index.js" ]