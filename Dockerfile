FROM node:10.16.0-alpine
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only-production\
    && npm install typescript -g

COPY . .

RUN tsc

CMD ["node", "dist/index.js"]

