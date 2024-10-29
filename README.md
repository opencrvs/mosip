<table>
<tr><td>
<img src="https://www.opencrvs.org/apple-touch-icon.png" height="100">
</td><td>
<img src="https://mosip.io/images/mosipn-logo.png" height="100" style="background:white">
</td></tr></table>

# OpenCRVS API for MOSIP

This package ensures a secure and a robust integration between OpenCRVS and MOSIP. It is supposed to be installed next to OpenCRVS, with the environment variables being the the integration details created in the National System Admin UI in OpenCRVS.

## Features

| Feature                                              | Status          |
| ---------------------------------------------------- | --------------- |
| Fetching a NID for a newborn                         | 🚧 In Progress  |
| Invalidating the NID for a deceased person           | 🚧 In Progress  |
| E-Signet form input for authenticating the informant | 🔜 To be coming |

## Development

```sh
yarn install

# start the web server
cd packages/server
yarn dev

# optionally run MOSIP mock server
cd packages/mosip-mock
yarn dev
```

## Country configuration

```diff
#src/index.ts

-import { eventRegistrationHandler } from '@countryconfig/api/event-registration/handler'
+import { mosipRegistrationHandler } from '@opencrvs-mosip/country-config'

 server.route({
   method: 'POST',
   path: '/event-registration',
-  handler: eventRegistrationHandler,
+  handler: mosipRegistrationHandler({ url: "http://localhost:20240" })),
   options: {
     tags: ['api'],
     description:
       'Opportunity for sychrounous integrations with 3rd party systems as a final step in event registration. If successful returns identifiers for that event.'
   }
 })
```

## Usage

The gateway runs by default in port 2024, the same year the stable version of the MOSIP integration is released. The MOSIP-mock service runs in 2024**0**.
