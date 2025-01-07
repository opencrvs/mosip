# OpenCRVS API for MOSIP

> [!WARNING]
> Work in progress! This release is not yet ready for production use.

This package ensures a secure and a robust integration between OpenCRVS and MOSIP. For instructions on how to setup the integration, please refer to the [installation.md](./docs/installation.md). For local development, see instructions below. For features and core versions supported, please refer to the [compatibility.md](./docs/compatibility.md).

## Development

```sh
# start the server and all the mocked servers
yarn install
yarn dev

# optionally run an individual package
cd packages/*
yarn install
yarn dev
```

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

## Usage

The gateway runs by default in port 2024, the same year the stable version of the MOSIP integration is released. The MOSIP-mock service runs in 2024**0**.
