FROM node:23.2.0
WORKDIR /usr/src/app

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY src/ src/
RUN yarn install --production --frozen-lockfile

EXPOSE 2024

CMD ["yarn", "start"]