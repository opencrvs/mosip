# OpenCRVS API for MOSIP

This repository provides an mediator/API layer that facilitates communication between OpenCRVS and MOSIP, enabling secure identity integration. Refer to [OpenCRVS documentation](https://documentation.opencrvs.org/technology/interoperability/national-id-client) for installation and deployment instructions.

## Prerequisites

- Node.js (see [`.nvmrc`](./.nvmrc) for version)
- Yarn (Node.js package manager)

## Development

```sh
# copy demo certs to gitignored location
cp docs/example-certs/* certs/

# install dependencies
yarn install

# start the mosip-api and all the mocked servers
yarn dev

# optionally...
# use a `.env` file at repository root for custom config
touch .env
yarn dev

# only run the main server without mocks
yarn dev --filter=@opencrvs/mosip-api

# bump package.json versions
yarn set-version 1.7.0-alpha.16
```

This project uses a **SQLite** database to store the record-specific tokens that OpenCRVS Core uses to allow editing the records. See [`./packages/mosip-api/src/database.ts`](./packages/mosip-api/src/database.ts) for more information.

The **environment variables** the server uses can be found at [`./packages/mosip-api/src/constants.ts`](./packages/mosip-api/src/constants.ts). Create a `.env` file in the root of the repository, if you want to override the local values.

The **identities** for E-Signet and IDA Auth mocks are found at [`./docs/mock-identities.json`](./docs/mock-identities.json).
