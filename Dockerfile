FROM node:12-slim
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN npm install yarn
RUN yarn
ENV NODE_ENV="production"
COPY . .
RUN yarn build
CMD [ "yarn", "start" ]
