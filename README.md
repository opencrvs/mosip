# OpenCRVS API for MOSIP

This package ensures a secure and a robust integration between OpenCRVS and MOSIP.

## Pre-requisities

- Node.js (see [`.nvmrc`](./.nvmrc) for version)

## Development

```sh
# copy demo certs to gitignored location
cp docs/example-certs/* certs/

# install dependencies
yarn install

# start the mosip-api and all the mocked servers
yarn dev

# optionally...
# use a `.env` file at repository root
touch .env
yarn dev

# only run the main server without mocks
yarn dev --filter=@opencrvs/mosip-api

# bump package.json versions
yarn set-version 1.7.0-alpha.16
```

This project uses a **SQLite** database to store the record-specific tokens that OpenCRVS Core uses to allow editing the records. See [./packages/mosip-api/src/database.ts](./packages/mosip-api/src/database.ts) for more information.
