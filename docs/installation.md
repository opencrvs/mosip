# Deploying OpenCRVS MOSIP integration

After you have finished your country configuration and tested it locally, you can continue deploying the integration.

## 1. Add MOSIP API to your docker-compose.yml

To add the API to your Docker Swarm deployment, you must configure your Docker Compose -file with environment variables. Note that gathering these values will be done in collaboration with your MOSIP developers and can take a while to gather. To speed up the configuration process, you can configure these values locally to a `.env` file to the root of this repository, and then copy them to your first deployment.

For E-Signet, OpenCRVS acts as a relying party. For the E-Signet related environment variables (`ESIGNET_*`, `OIDP_CLIENT_PRIVATE_KEY_PATH` and `OPENID_PROVIDER_CLAIMS`), you can get more information from [E-Signet documentation](https://docs.esignet.io/test/integration/relying-party).

```yml
mosip-api:
  image: ghcr.io/opencrvs/mosip-api:1.8.0
  volumes:
    - "/data/sqlite:/data/sqlite" # Defines the location of the SQLite database MOSIP API uses
  environment:
    # MOSIP API configuration
    - NODE_ENV=production
    - OPENCRVS_GRAPHQL_GATEWAY_URL=http://gateway:7070/graphql
    - OPENCRVS_PUBLIC_KEY_URL=http://auth:4040/.well-known
    - LOCALE=en
    - CLIENT_APP_URL=https://register.{{hostname}}
    - SQLITE_DATABASE_PATH=/data/sqlite/mosip-api.db

    # Packet Manager / WebSub / Verifiable Credentials
    - DECRYPT_P12_FILE_PATH=${DECRYPT_P12_FILE_PATH}
    - DECRYPT_P12_FILE_PASSWORD=${DECRYPT_P12_FILE_PASSWORD}
    - ENCRYPT_CERT_PATH=${ENCRYPT_CERT_PATH}
    - MOSIP_AUTH_CLIENT_ID=${MOSIP_AUTH_CLIENT_ID}
    - MOSIP_AUTH_CLIENT_SECRET=${MOSIP_AUTH_CLIENT_SECRET}
    - MOSIP_AUTH_URL=${MOSIP_AUTH_URL}
    - MOSIP_WEBSUB_CALLBACK_URL=https://mosip-api.{{hostname}}/websub/callback
    - MOSIP_WEBSUB_HUB_URL=${MOSIP_WEBSUB_HUB_URL}
    - MOSIP_WEBSUB_SECRET=${MOSIP_WEBSUB_SECRET}
    - MOSIP_WEBSUB_TOPIC=${MOSIP_WEBSUB_TOPIC}
    - MOSIP_CREATE_PACKET_URL=${MOSIP_CREATE_PACKET_URL}
    - MOSIP_PROCESS_PACKET_URL=${MOSIP_PROCESS_PACKET_URL}
    - MOSIP_VERIFIABLE_CREDENTIAL_ALLOWLIST=${MOSIP_VERIFIABLE_CREDENTIAL_ALLOWLIST}

    # (optional:) E-Signet
    # Use placeholders if you're not using E-Signet
    - ESIGNET_USERINFO_URL=${ESIGNET_USERINFO_URL}
    - ESIGNET_TOKEN_URL=${ESIGNET_TOKEN_URL}
    - ESIGNET_REDIRECT_URL=${ESIGNET_REDIRECT_URL}
    - OIDP_CLIENT_PRIVATE_KEY_PATH=${OIDP_CLIENT_PRIVATE_KEY_PATH} # or /dev/null
    - OPENID_PROVIDER_CLAIMS=${OPENID_PROVIDER_CLAIMS}

    # (optional:) ID Authentication
    # Use placeholders if you're not using ID Authentication
    - IDA_AUTH_DOMAIN_URI=${IDA_AUTH_DOMAIN_URI}
    - IDA_AUTH_URL=${IDA_AUTH_URL}
    - PARTNER_APIKEY=${PARTNER_APIKEY}
    - PARTNER_ID=${PARTNER_ID}
    - PARTNER_MISP_LK=${PARTNER_MISP_LK}
    - SIGN_P12_FILE_PATH=${SIGN_P12_FILE_PATH} #@TODO: Would this throw?
    - SIGN_P12_FILE_PASSWORD=${SIGN_P12_FILE_PASSWORD} #@TODO: Would this throw?
```

# 2. Configure Traefik and logging

Next, expose MOSIP API for MOSIP to be able to connect to it. Add the following code block to the previous `mosip-api` service.

> ![IMPORTANT]
> Consider blocking all traffic to the MOSIP API except from MOSIP. Read [Traefik IPAllowList](https://doc.traefik.io/traefik/middlewares/http/ipallowlist/).

```yml
deploy:
  replicas: 1
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.mosip-api.rule=Host(`mosip-api.{{hostname}}`)"
    - "traefik.http.services.mosip-api.loadbalancer.server.port=2024"
    - "traefik.http.routers.mosip-api.tls=true"
    - "traefik.http.routers.mosip-api.tls.certresolver=certResolver"
    - "traefik.http.routers.mosip-api.entrypoints=web,websecure"
    - "traefik.http.routers.mosip-api.middlewares=gzip-compression"
    - "traefik.docker.network=opencrvs_overlay_net"
    - "traefik.http.middlewares.mosip-api.headers.customresponseheaders.Pragma=no-cache"
    - "traefik.http.middlewares.mosip-api.headers.customresponseheaders.Cache-control=no-store"
    - "traefik.http.middlewares.mosip-api.headers.customresponseheaders.X-Robots-Tag=none"
    - "traefik.http.middlewares.mosip-api.headers.stsseconds=31536000"
    - "traefik.http.middlewares.mosip-api.headers.stsincludesubdomains=true"
    - "traefik.http.middlewares.mosip-api.headers.stspreload=true"
networks:
  - overlay_net
logging:
  driver: gelf
  options:
    gelf-address: "udp://127.0.0.1:12201"
    tag: "mosip-api"
```
