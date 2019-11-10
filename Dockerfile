FROM node:10.16.0-alpine
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run compile

CMD ["node", "dist/index.js"]

