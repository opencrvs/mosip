# OpenCRVS API for MOSIP

> [!WARNING]
> Work in progress! This release is not yet ready for production use.

This package ensures a secure and a robust integration between OpenCRVS and MOSIP. For instructions on how to setup the integration, please refer to the [installation.md](./docs/installation.md). For local development, see instructions below. For features and core versions supported, please refer to the [compatibility.md](./docs/compatibility.md).

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

## Country configuration

```sh
# installs the npm package that is used to replace the default eventRegistrationHandler
yarn add @opencrvs/mosip
```

[@opencrvs/opencrvs-countryconfig/src/index.ts](https://github.com/opencrvs/opencrvs-countryconfig/blob/9531d88008829978ef8553bb345ba04aeaab06de/src/index.ts#L413)

```diff
-import { eventRegistrationHandler } from '@countryconfig/api/event-registration/handler'
+import { mosipRegistrationHandler } from '@opencrvs/mosip'

 server.route({
   method: 'POST',
   path: '/event-registration',
-  handler: eventRegistrationHandler,
+  handler: mosipRegistrationHandler({ url: "http://localhost:2024" })),
   options: {
     tags: ['api'],
     description:
       'Opportunity for sychrounous integrations with 3rd party systems as a final step in event registration. If successful returns identifiers for that event.'
   }
 })
```
