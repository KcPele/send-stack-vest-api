FROM node:18.17.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn

# copy the app to work dir
COPY . .

# transpile the typescript code
RUN yarn transpile

# port to run the app
EXPOSE 5000

CMD ["node", "dist/server.js"]