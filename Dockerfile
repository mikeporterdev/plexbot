FROM node:10.16.0-alpine AS base
WORKDIR /usr/src/app

# development
FROM base AS dev
RUN npm install typescript -g

# build
FROM dev as build
COPY . .
RUN npm install --only-production
RUN tsc

# production
FROM base as prod

COPY --from=build \
    /usr/src/app/dist \
    /usr/src/app/dist

COPY --from=build \
    /usr/src/app/node_modules \
    /usr/src/app/node_modules

CMD ["node", "dist/index.js"]

