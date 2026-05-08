# Set-up Collab environment locally

1. Add `.env` with these values. Note that some are `<redacted>` and others might be different for your use, like `PARTNER_MISP_LK`. The cert / p12 file paths you will need to change to your own.

```bash
MOSIP_WEBSUB_TOPIC=crvs_partner/CREDENTIAL_ISSUED
MOSIP_WEBSUB_SECRET=<redacted>
MOSIP_CREATE_PACKET_URL=https://api-internal.collab.mosip.net/commons/v1/packetmanager/createPacket
MOSIP_PROCESS_PACKET_URL=https://api-internal.collab.mosip.net/registrationprocessor/v1/workflowmanager/workflowinstance
MOSIP_VERIFIABLE_CREDENTIAL_ALLOWLIST=https://api.collab.mosip.net/.well-known/public-key.json

MOSIP_CENTER_ID=10001
MOSIP_MACHINE_ID=20042
MOSIP_PACKET_AUTH_CLIENT_ID=mosip-crvs1-client
MOSIP_PACKET_AUTH_CLIENT_SECRET=<redacted>
MOSIP_WEBSUB_AUTH_CLIENT_ID=crvs_partner
MOSIP_WEBSUB_AUTH_CLIENT_SECRET=<redacted>
MOSIP_AUTH_CLIENT_APP_ID=ida
MOSIP_WEBSUB_CALLBACK_URL=https://c542-91-152-187-244.ngrok-free.app/websub/callback
PARTNER_APIKEY=<redacted>
PARTNER_ID=<redacted>
PARTNER_MISP_LK=opencrvs-auth-partner
IDA_AUTH_DOMAIN_URI=https://api-internal.collab.mosip.net
IDA_AUTH_URL=https://api.collab.mosip.net/idauthentication/v1/auth
MOSIP_AUTH_URL=https://api-internal.collab.mosip.net/v1/authmanager/authenticate/clientidsecretkey

ESIGNET_USERINFO_URL=https://esignet-mosipid.collab.mosip.net/v1/esignet/oidc/userinfo
ESIGNET_TOKEN_URL=https://esignet-mosipid.collab.mosip.net/v1/esignet/oauth/v2/token

ENCRYPT_CERT_PATH=../../certs/2026-mosip-connect/ida-partner.crt
DECRYPT_P12_FILE_PATH=../../certs/2026-mosip-connect/keystore.p12
DECRYPT_P12_FILE_PASSWORD=mosip123
SIGN_P12_FILE_PATH=../../certs/2026-mosip-connect/keystore.p12
OIDP_CLIENT_PRIVATE_KEY_PATH=../../certs/2026-mosip-connect/esignet-jwk.txt
MOSIP_WEBSUB_HUB_URL=https://api-internal.collab.mosip.net/hub
```

2. To receive WebSub from MOSIP, you need to expose your environment to public internet. Use Ngrok with: `ngrok http 2024`
3. Copy your Ngrok URL like `https://d7c3-91-152-187-244.ngrok-free.app`, add `/websub/callback` and replace env variable `MOSIP_WEBSUB_CALLBACK_URL` with your URL.
4. Start the environment with `yarn workspace @opencrvs/mosip-api run dev`
