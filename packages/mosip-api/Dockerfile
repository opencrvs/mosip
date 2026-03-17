FROM node:23.9.0-bookworm-slim

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY packages/mosip-api/package.json packages/mosip-api/package.json
COPY packages/country-config/package.json packages/country-config/package.json
RUN yarn install --frozen-lockfile --production=false && yarn cache clean

COPY packages/mosip-api/ packages/mosip-api/
COPY packages/country-config/ packages/country-config/

RUN yarn workspace @opencrvs/mosip run build

RUN mkdir -p /data/sqlite && chown node:node /data/sqlite

WORKDIR /usr/src/app/packages/mosip-api

USER node

CMD ["yarn", "start"]
