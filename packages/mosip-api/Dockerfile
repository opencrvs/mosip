FROM node:23.1.0
WORKDIR /usr/src/app

COPY package.json package.json
COPY tsconfig.json tsconfig.json
RUN yarn install --production --frozen-lockfile
COPY src/ src/

CMD ["yarn", "start"]