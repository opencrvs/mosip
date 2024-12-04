<table>
<tr><td>
<img src="https://www.opencrvs.org/apple-touch-icon.png" height="100">
</td><td>
<img src="https://mosip.io/images/mosipn-logo.png" height="100" style="background:white">
</td></tr></table>

# OpenCRVS API for MOSIP

This package ensures a secure and a robust integration between OpenCRVS and MOSIP. For instructions on how to setup the integration, please refer to the [installation.md](./docs/installation.md). For local development, see instructions below. For features and core versions supported, please refer to the [compatibility.md](./docs/compatibility.md).

## Development

```sh
# start the web server
cd packages/server
yarn install
yarn dev

# optionally run MOSIP mock server
cd packages/mosip-mock
yarn install
yarn dev
```

## Pull request deploys

Pull requests deploy a new version to the [opencrvs/e2e](https://github.com/opencrvs/e2e/tree/mosip) -environment using `mosip` branch. It uses `develop` @ [opencrvs/opencrvs-core](https://github.com/opencrvs/opencrvs-core/tree/develop) and `mosip` @ [opencrvs/opencrvs-farajaland](https://github.com/opencrvs/opencrvs-farajaland) by default. In case the PR branch name is available in core and/or Farajaland, the respective branches are being used.

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
